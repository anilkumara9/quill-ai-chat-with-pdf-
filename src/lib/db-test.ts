import { prisma } from './db';

export async function testDatabaseConnection() {
  try {
    // Test the connection
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful:', result);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
} 