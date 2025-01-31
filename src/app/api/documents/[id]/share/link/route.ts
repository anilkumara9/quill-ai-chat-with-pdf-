import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { nanoid } from "nanoid";

const shareSchema = z.object({
  permission: z.enum(["view", "edit"]),
  expiresAt: z.string().datetime().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if document exists and user has access
    const document = await prisma.document.findUnique({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = shareSchema.parse(body);

    // Create share link
    const shareLink = await prisma.shareLink.create({
      data: {
        id: nanoid(10),
        documentId: params.id,
        permission: validatedData.permission,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
        createdBy: userId,
      },
    });

    // Generate the actual URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const shareUrl = `${baseUrl}/shared/${shareLink.id}`;

    return NextResponse.json({
      id: shareLink.id,
      permission: shareLink.permission,
      expiresAt: shareLink.expiresAt,
      url: shareUrl,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid share data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[SHARE_LINK_CREATE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get all share links for the document
    const shareLinks = await prisma.shareLink.findMany({
      where: {
        documentId: params.id,
        createdBy: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Generate URLs for each link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const formattedLinks = shareLinks.map((link) => ({
      id: link.id,
      permission: link.permission,
      expiresAt: link.expiresAt,
      url: `${baseUrl}/shared/${link.id}`,
    }));

    return NextResponse.json(formattedLinks);
  } catch (error) {
    console.error("[SHARE_LINKS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch share links" },
      { status: 500 }
    );
  }
} 