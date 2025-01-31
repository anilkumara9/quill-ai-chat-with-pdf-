import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { rateLimiter } from "@/lib/rate-limit";
import { Groq } from "groq-sdk";
import { processDocument } from "@/lib/document-processor";
import { generateEmbeddings } from "@/lib/embeddings";

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// AWAN LLM API configuration
const AWAN_API_KEY = "374df25c-93cd-411b-b34f-8dc40b26bbd6";
const AWAN_API_URL = "https://api.awan.ai/v1";

// Enhanced query parameters schema
const querySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  limit: z.string().optional().transform(val => parseInt(val || '10')),
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['title', 'createdAt', 'updatedAt', 'fileSize']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  model: z.enum(['groq', 'awan', 'gpt4']).default('groq'),
  task: z.enum(['summarize', 'analyze', 'query', 'translate']).optional(),
  language: z.string().optional(),
});

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper function to process with AWAN LLM
async function processWithAwan(text: string, task: string) {
  try {
    const response = await fetch(`${AWAN_API_URL}/process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AWAN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        task,
        model: 'awan-large-v2',
      }),
    });

    if (!response.ok) {
      throw new Error(`AWAN API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('AWAN processing error:', error);
    throw error;
  }
}

// Helper function to process with Groq
async function processWithGroq(text: string, task: string) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an AI assistant specialized in ${task} tasks. Process the following text accordingly.`
        },
        {
          role: "user",
          content: text
        }
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.5,
      max_tokens: 2048,
    });

    return completion.choices[0]?.message?.content;
  } catch (error) {
    console.error('Groq processing error:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitResult = rateLimiter(userId, {
      maxRequests: 50,
      windowMs: 60 * 1000,
    });

    if (rateLimitResult) {
      return rateLimitResult;
    }

    const body = await req.json();
    const { documentId, task, model = 'groq', language } = body;

    // Fetch document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { userId },
          { shares: { some: { userId } } }
        ]
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found or access denied" },
        { status: 404 }
      );
    }

    // Process document content
    const processedContent = await processDocument(document.content, document.fileType);
    
    // Generate embeddings for semantic search
    const embeddings = await generateEmbeddings(processedContent);

    // Process with selected model
    let result;
    try {
      switch (model) {
        case 'awan':
          result = await processWithAwan(processedContent, task);
          break;
        case 'groq':
          result = await processWithGroq(processedContent, task);
          break;
        default:
          throw new Error('Unsupported model');
      }

      // Save processing history
      await prisma.documentActivity.create({
        data: {
          documentId: document.id,
          userId,
          action: task,
          details: {
            model,
            language,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return NextResponse.json({
        success: true,
        result,
        metadata: {
          model,
          task,
          documentId: document.id,
          timestamp: new Date().toISOString(),
          embeddings: embeddings.slice(0, 5), // First 5 embeddings for reference
        },
      });

    } catch (processingError) {
      console.error(`${model.toUpperCase()} processing error:`, processingError);
      return NextResponse.json(
        {
          error: `Failed to process with ${model}`,
          details: processingError instanceof Error ? processingError.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Document processing error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const url = new URL(req.url);
    const queryResult = querySchema.safeParse(Object.fromEntries(url.searchParams));
    
    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.errors },
        { status: 400 }
      );
    }

    const { page, limit, category, search, sort, order, model, task } = queryResult.data;
    const skip = (page - 1) * limit;

    // Build the where clause
    const where = {
      userId,
      ...(category && { categoryId: category }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    // Get documents with processing history
    const [documents, processingStats] = await prisma.$transaction([
      prisma.document.findMany({
        where,
        include: {
          category: true,
          activities: {
            where: {
              action: task,
            },
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: sort ? { [sort]: order || 'desc' } : { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.documentActivity.groupBy({
        by: ['action'],
        where: { userId },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        documents: documents.map(doc => ({
          ...doc,
          lastProcessed: doc.activities[0]?.createdAt || null,
        })),
        processingStats,
      },
      pagination: {
        page,
        limit,
        hasMore: documents.length === limit,
      },
      metadata: {
        availableModels: ['groq', 'awan'],
        supportedTasks: ['summarize', 'analyze', 'query', 'translate'],
        currentModel: model,
        currentTask: task,
      },
    });

  } catch (error) {
    console.error("Error in GET route:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
} 