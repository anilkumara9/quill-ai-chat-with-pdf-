import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = auth();
    const user = await currentUser();
    
    console.log("[SYNC_USER] Starting sync for userId:", userId);
    
    if (!userId || !user) {
      console.error("[SYNC_USER] No userId or user found");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get primary email
    const primaryEmail = user.emailAddresses.find(
      email => email.id === user.primaryEmailAddressId
    )?.emailAddress;

    console.log("[SYNC_USER] Primary email:", primaryEmail);

    if (!primaryEmail) {
      console.error("[SYNC_USER] No primary email found");
      return NextResponse.json(
        { error: "No primary email found" },
        { status: 400 }
      );
    }

    // First check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    console.log("[SYNC_USER] Existing user:", existingUser);

    try {
      let dbUser;
      
      if (existingUser) {
        // Update existing user
        dbUser = await prisma.user.update({
          where: { id: userId },
          data: {
            email: primaryEmail,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
            image: user.imageUrl,
          },
        });
        console.log("[SYNC_USER] Updated user:", dbUser.id);
      } else {
        // Create new user
        dbUser = await prisma.user.create({
          data: {
            id: userId,
            email: primaryEmail,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
            image: user.imageUrl,
          },
        });
        console.log("[SYNC_USER] Created new user:", dbUser.id);
      }

      return NextResponse.json({
        success: true,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          image: dbUser.image,
        },
      });
    } catch (dbError) {
      console.error("[SYNC_USER_DB_ERROR]", dbError);
      
      // Try one more time with a clean create
      try {
        const newUser = await prisma.user.create({
          data: {
            id: userId,
            email: primaryEmail,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
            image: user.imageUrl,
          },
        });

        console.log("[SYNC_USER] Created user after error:", newUser.id);

        return NextResponse.json({
          success: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            image: newUser.image,
          },
        });
      } catch (finalError) {
        console.error("[SYNC_USER_FINAL_ERROR]", finalError);
        throw finalError;
      }
    }
  } catch (error) {
    console.error("[SYNC_USER_ERROR]", error);
    return NextResponse.json(
      { 
        error: "Failed to sync user",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 