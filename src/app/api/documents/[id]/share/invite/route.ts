import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const inviteSchema = z.object({
  email: z.string().email(),
  permission: z.enum(["view", "edit"]),
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
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            emailAddresses: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = inviteSchema.parse(body);

    // Create share invitation
    const invitation = await prisma.shareInvitation.create({
      data: {
        documentId: params.id,
        email: validatedData.email,
        permission: validatedData.permission,
        invitedBy: userId,
      },
    });

    // Generate invitation URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/${invitation.id}`;

    // Send invitation email
    const senderName = document.user.firstName
      ? `${document.user.firstName} ${document.user.lastName || ""}`
      : document.user.emailAddresses[0]?.emailAddress || "Someone";

    await resend.emails.send({
      from: "Quill <notifications@quill.yourdomain.com>",
      to: validatedData.email,
      subject: `${senderName} shared a document with you`,
      html: `
        <div>
          <h2>${senderName} has shared a document with you</h2>
          <p>You've been invited to ${validatedData.permission} "${document.title}"</p>
          <p>Click the link below to access the document:</p>
          <a href="${inviteUrl}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Document
          </a>
          <p style="color: #666; margin-top: 24px;">
            If you can't click the button, copy and paste this URL into your browser:<br>
            ${inviteUrl}
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid invitation data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[SHARE_INVITE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
} 