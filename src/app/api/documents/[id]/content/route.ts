import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { del, list } from "@vercel/blob";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    // Get document with access check
    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId },
          {
            shares: {
              some: {
                userId
              }
            }
          }
        ]
      },
      select: {
        id: true,
        title: true,
        content: true,
        fileType: true,
        createdAt: true,
        versions: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          select: {
            content: true
          }
        }
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found or access denied" },
        { status: 404 }
      );
    }

    let content: string;

    // First try to get content from the document's content field
    if (document.content.startsWith('blob:')) {
      try {
        // List all blobs to find the matching one
        const blobs = await list();
        const blob = blobs.blobs.find(b => b.url === document.content);
        
        if (!blob) {
          throw new Error('Blob not found');
        }

        const response = await fetch(blob.url);
        if (!response.ok) {
          throw new Error('Failed to fetch blob content');
        }

        content = await response.text();

        // Clean and process the content
        content = content
          .replace(/\\n/g, '\n')  // Replace escaped newlines
          .replace(/\u0000/g, '') // Remove null characters
          .replace(/\r\n/g, '\n') // Normalize line endings
          .replace(/\r/g, '\n')   // Normalize line endings
          .replace(/[^\S\n]+/g, ' ') // Replace multiple spaces with single space
          .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
          .trim();

      } catch (blobError) {
        console.error("[BLOB_FETCH_ERROR]", blobError);
        
        // If blob fetch fails, try to get content from the latest version
        if (document.versions?.[0]?.content) {
          content = document.versions[0].content;
        } else {
          // If no version exists, return the raw content as fallback
          content = document.content;
        }
      }
    } else {
      // If content is not a blob URL, use it directly
      content = document.content;
    }

    // Clean and validate the content
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: "Invalid document content" },
        { status: 500 }
      );
    }

    // If content is too short, it might indicate extraction failed
    if (content.length < 10) {
      return NextResponse.json(
        { error: "Document content extraction failed or content is too short" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: document.id,
      title: document.title,
      content,
      fileType: document.fileType,
      createdAt: document.createdAt,
    });
  } catch (error) {
    console.error("[DOCUMENT_CONTENT_ERROR]", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch document content",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 