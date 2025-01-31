import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

// Simplified schema that matches the actual form data structure
const UploadSchema = z.object({
  title: z.string().min(1).max(255),
  categoryId: z.string().optional().nullable(),
  file: z.instanceof(File, { message: "Invalid file object" })
});

function generateSafeFileName(originalName: string): string {
  const timestamp = Date.now();
  const safeName = originalName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-');
  return `${safeName}-${timestamp}`;
}

function validateFile(file: File) {
  const errors: string[] = [];

  if (!file || !(file instanceof File)) {
    errors.push("Invalid file object provided");
    return errors;
  }

  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type as any)) {
    errors.push(`File type '${file.type}' not supported. Allowed types: PDF, Text, Word`);
  }

  return errors;
}

async function ensureUserExists(userId: string) {
  try {
    // First check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (existingUser) {
      console.log("[UPLOAD] Found existing user:", existingUser.id);
      return existingUser;
    }

    // If user doesn't exist, get their info from Clerk
    const clerkUser = await currentUser();
    if (!clerkUser) {
      throw new Error("Failed to get user information from Clerk");
    }

    // Get primary email
    const primaryEmail = clerkUser.emailAddresses.find(
      email => email.id === clerkUser.primaryEmailAddressId
    )?.emailAddress;

    if (!primaryEmail) {
      throw new Error("No primary email found for user");
    }

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email: primaryEmail,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
        image: clerkUser.imageUrl,
      },
    });

    console.log("[UPLOAD] Created new user:", newUser.id);
    return newUser;
  } catch (error) {
    console.error("[ENSURE_USER_ERROR]", error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    // Authentication check
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    console.log("[UPLOAD] Starting upload for user:", userId);

    // Ensure user exists in database
    try {
      const user = await ensureUserExists(userId);
      console.log("[UPLOAD] Confirmed user exists:", user.id);
    } catch (error) {
      console.error("[USER_SYNC_ERROR]", error);
      return NextResponse.json(
        {
          error: "Failed to sync user data",
          code: "USER_SYNC_ERROR",
          details: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 500 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file");
    const title = formData.get("title") as string | null;
    const categoryId = formData.get("categoryId") as string | null;

    console.log("[UPLOAD] Received form data:", {
      file: file ? { name: (file as File).name, type: (file as File).type } : null,
      title,
      categoryId
    });

    // Basic validation
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { 
          error: "No valid file provided", 
          code: "INVALID_FILE",
          details: "The uploaded file is invalid or missing"
        },
        { status: 400 }
      );
    }

    // Validate file
    const fileErrors = validateFile(file);
    if (fileErrors.length > 0) {
      return NextResponse.json(
        { 
          error: "File validation failed", 
          code: "FILE_VALIDATION_ERROR",
          details: fileErrors 
        },
        { status: 400 }
      );
    }

    // Clean and validate the title
    const cleanTitle = (title || file.name).trim();
    if (!cleanTitle) {
      return NextResponse.json(
        {
          error: "Invalid title",
          code: "VALIDATION_ERROR",
          details: "Document title is required"
        },
        { status: 400 }
      );
    }

    // Double check user exists before proceeding
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!userExists) {
      return NextResponse.json(
        {
          error: "User not found",
          code: "USER_NOT_FOUND",
          details: "User does not exist in the database"
        },
        { status: 404 }
      );
    }

    // Check for duplicate title
    const existingDocument = await prisma.document.findFirst({
      where: {
        userId,
        title: cleanTitle,
      },
    });

    if (existingDocument) {
      return NextResponse.json(
        { 
          error: "A document with this title already exists",
          code: "DUPLICATE_TITLE",
          documentId: existingDocument.id
        },
        { status: 409 }
      );
    }

    // Upload file to blob storage with retry logic
    let blobUrl: string | null = null;
    let uploadAttempts = 0;
    const maxUploadAttempts = 3;

    while (uploadAttempts < maxUploadAttempts) {
      try {
        const safeName = generateSafeFileName(file.name);
        console.log("[UPLOAD] Attempting to upload to blob storage:", safeName);
        
        const blob = await put(safeName, file, {
          access: 'public',
          addRandomSuffix: true,
          contentType: file.type,
          cacheControl: `public, max-age=${60 * 60 * 24 * 30}`, // 30 days
        });
        
        blobUrl = blob.url;
        console.log("[UPLOAD] Successfully uploaded to blob storage:", blobUrl);
        break;
      } catch (error) {
        uploadAttempts++;
        console.error(`[UPLOAD] Attempt ${uploadAttempts} failed:`, error);
        if (uploadAttempts === maxUploadAttempts) {
          return NextResponse.json(
            { 
              error: "Failed to upload file to storage",
              code: "STORAGE_ERROR",
              details: error instanceof Error ? error.message : "Unknown storage error"
            },
            { status: 503 }
          );
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
      }
    }

    if (!blobUrl) {
      return NextResponse.json(
        { 
          error: "Failed to get upload URL",
          code: "UPLOAD_URL_ERROR"
        },
        { status: 500 }
      );
    }

    // Create document record with transaction
    try {
      console.log("[UPLOAD] Creating document record");
      
      const document = await prisma.$transaction(async (tx) => {
        // Create document
        const doc = await tx.document.create({
          data: {
            title: cleanTitle,
            content: blobUrl,
            fileType: file.type,
            fileSize: file.size,
            userId,
            categoryId: categoryId || null,
            status: 'pending',
            uploadedAt: new Date(),
          },
        });

        console.log("[UPLOAD] Created document:", doc.id);

        // Create initial version without changes field
        await tx.version.create({
          data: {
            documentId: doc.id,
            content: blobUrl,
          },
        });

        // Log activity
        await tx.documentActivity.create({
          data: {
            documentId: doc.id,
            userId,
            action: "UPLOAD",
            details: {
              fileType: file.type,
              fileSize: file.size,
              originalName: file.name,
            },
          },
        });

        return doc;
      });

      console.log("[UPLOAD] Successfully completed transaction");

      return NextResponse.json({
        success: true,
        document: {
          id: document.id,
          title: document.title,
          url: blobUrl,
          fileType: document.fileType,
          fileSize: document.fileSize,
          createdAt: document.createdAt,
          status: document.status,
        },
      });
    } catch (dbError) {
      console.error("[DB_ERROR]", dbError);
      return NextResponse.json(
        { 
          error: "Database operation failed",
          code: "DB_ERROR",
          details: dbError instanceof Error ? dbError.message : "Unknown database error"
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("[UPLOAD_ERROR]", error);
    return NextResponse.json(
      { 
        error: "Failed to upload document",
        code: "UNKNOWN_ERROR",
        details: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
} 