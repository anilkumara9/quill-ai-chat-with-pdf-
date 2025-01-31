import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Find the share link
    const shareLink = await prisma.shareLink.findUnique({
      where: {
        id: params.id,
      },
      include: {
        document: true,
      },
    });

    if (!shareLink) {
      // Check if it's an invitation
      const invitation = await prisma.shareInvitation.findUnique({
        where: {
          id: params.id,
        },
        include: {
          document: true,
        },
      });

      if (!invitation) {
        return NextResponse.json(
          { error: "Share link not found" },
          { status: 404 }
        );
      }

      // Check if invitation has expired
      if (invitation.expiresAt && invitation.expiresAt < new Date()) {
        return NextResponse.json(
          { error: "Share link has expired" },
          { status: 403 }
        );
      }

      // Check if user is authenticated and matches the invitation email
      const { userId } = auth();
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { emailAddresses: true },
        });

        const userEmails = user?.emailAddresses.map((e) => e.emailAddress) || [];
        if (!userEmails.includes(invitation.email)) {
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 403 }
          );
        }
      }

      // Update invitation if not already accepted
      if (!invitation.acceptedAt) {
        await prisma.shareInvitation.update({
          where: { id: params.id },
          data: { acceptedAt: new Date() },
        });
      }

      return NextResponse.json({
        id: invitation.document.id,
        title: invitation.document.title,
        content: invitation.document.content,
        fileType: invitation.document.fileType,
        fileSize: invitation.document.fileSize,
        createdAt: invitation.document.createdAt,
        permission: invitation.permission,
      });
    }

    // Check if share link has expired
    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Share link has expired" },
        { status: 403 }
      );
    }

    // Update share link usage statistics
    await prisma.shareLink.update({
      where: { id: params.id },
      data: {
        lastUsedAt: new Date(),
        useCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      id: shareLink.document.id,
      title: shareLink.document.title,
      content: shareLink.document.content,
      fileType: shareLink.document.fileType,
      fileSize: shareLink.document.fileSize,
      createdAt: shareLink.document.createdAt,
      permission: shareLink.permission,
    });
  } catch (error) {
    console.error("[SHARED_DOCUMENT_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch shared document" },
      { status: 500 }
    );
  }
} 