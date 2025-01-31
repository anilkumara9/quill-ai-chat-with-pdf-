import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DocumentProcessor } from "@/lib/document-processor";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const data = await req.json();
    const { documentId } = data;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Check document exists and user has access
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { userId },
          {
            shares: {
              some: {
                userId,
                permission: { in: ["read", "write"] }
              }
            }
          }
        ]
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found or access denied" },
        { status: 404 }
      );
    }

    // Start processing
    const processor = DocumentProcessor.getInstance();
    const result = await processor.processDocument(documentId);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: "Processing failed",
          details: result.error
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "completed",
      metadata: result.metadata
    });
  } catch (error) {
    console.error("[EXTRACT_CONTENT_ERROR]", error);
    return NextResponse.json(
      { 
        error: "Processing failed",
        details: error instanceof Error ? error.message : "An unexpected error occurred"
      },
      { status: 500 }
    );
  }
} 