import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { del } from "@vercel/blob";
import { z } from "zod";

const ErrorTypes = {
  AUTHENTICATION: "AUTHENTICATION_ERROR",
  NOT_FOUND: "NOT_FOUND_ERROR",
  PERMISSION: "PERMISSION_ERROR",
  VALIDATION: "VALIDATION_ERROR",
  STORAGE: "STORAGE_ERROR",
  DATABASE: "DATABASE_ERROR",
  UNKNOWN: "UNKNOWN_ERROR",
} as const;

type ErrorResponse = {
  error: string;
  type: typeof ErrorTypes[keyof typeof ErrorTypes];
  details?: unknown;
};

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Authentication required",
          type: ErrorTypes.AUTHENTICATION,
        },
        { status: 401 }
      );
    }

    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId },
          {
            shares: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      include: {
        shares: {
          select: {
            id: true,
            userId: true,
            createdAt: true,
          },
        },
        chats: {
          select: {
            id: true,
            createdAt: true,
            _count: {
              select: {
                messages: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Document not found or access denied",
          type: ErrorTypes.NOT_FOUND,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("[GET_DOCUMENT_ERROR]", error);
    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to fetch document",
        type: ErrorTypes.UNKNOWN,
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Authentication required",
          type: ErrorTypes.AUTHENTICATION,
        },
        { status: 401 }
      );
    }

    const UpdateDocumentSchema = z.object({
      title: z.string().min(1).optional(),
      description: z.string().optional(),
    });

    const body = await req.json();
    const validationResult = UpdateDocumentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Invalid request format",
          type: ErrorTypes.VALIDATION,
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { title, description } = validationResult.data;

    const document = await prisma.document.update({
      where: {
        id: params.id,
        userId,
      },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
      },
      select: {
        id: true,
        title: true,
        description: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("[UPDATE_DOCUMENT_ERROR]", error);
    
    if (error.code === "P2025") {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Document not found or access denied",
          type: ErrorTypes.NOT_FOUND,
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to update document",
        type: ErrorTypes.UNKNOWN,
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Authentication required",
          type: ErrorTypes.AUTHENTICATION,
        },
        { status: 401 }
      );
    }

    const document = await prisma.document.findUnique({
      where: {
        id: params.id,
        userId,
      },
      include: {
        chats: {
          include: {
            messages: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Document not found or access denied",
          type: ErrorTypes.NOT_FOUND,
        },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      if (document.chats.length > 0) {
        await tx.message.deleteMany({
          where: {
            chatId: {
              in: document.chats.map(chat => chat.id),
            },
          },
        });

        await tx.chat.deleteMany({
          where: {
            documentId: document.id,
          },
        });
      }

      await tx.share.deleteMany({
        where: {
          documentId: document.id,
        },
      });

      await tx.document.delete({
        where: {
          id: document.id,
        },
      });
    });

    if (document.url) {
      try {
        await del(document.url);
      } catch (error) {
        console.error("[STORAGE_DELETE_ERROR]", error);
      }
    }

    return NextResponse.json({
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE_DOCUMENT_ERROR]", error);

    if (error.code === "P2025") {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Document not found or access denied",
          type: ErrorTypes.NOT_FOUND,
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to delete document",
        type: ErrorTypes.UNKNOWN,
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
