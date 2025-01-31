import { NextResponse } from "next/server";
import { prisma, testConnection } from "@/lib/db";

export async function GET() {
  try {
    // Test the connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection test failed');
    }

    // Run a simple query to verify database access
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('Database query successful:', result);

    // Get some basic stats
    const stats = await prisma.$transaction([
      prisma.user.count(),
      prisma.document.count(),
      prisma.category.count()
    ]);

    return NextResponse.json({ 
      status: "Database connection successful",
      stats: {
        users: stats[0],
        documents: stats[1],
        categories: stats[2]
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    // Try to reconnect
    try {
      await prisma.$disconnect();
      await prisma.$connect();
      console.log('Reconnection successful');
    } catch (reconnectError) {
      console.error('Reconnection failed:', reconnectError);
    }

    return NextResponse.json(
      { 
        error: "Database connection failed", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 