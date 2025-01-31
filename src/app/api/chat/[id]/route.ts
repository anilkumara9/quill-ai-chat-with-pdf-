import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Groq } from "groq-sdk";

// Initialize Groq client with error handling
let groq: Groq;
try {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
} catch (error) {
  console.error("[GROQ_INIT_ERROR]", error);
  groq = null as any;
}

// Token limits and content settings
const MAX_TOTAL_TOKENS = 4000;
const CHARS_PER_TOKEN = 4;
const MAX_CONTENT_LENGTH = MAX_TOTAL_TOKENS * CHARS_PER_TOKEN;
const SUMMARY_LENGTH = 2000;

function extractTextFromPDFContent(pdfContent: string): string {
  try {
    // Remove binary data and focus on text content
    const cleanContent = pdfContent.replace(/[\x00-\x1F\x7F-\xFF]/g, '');
    
    // Extract text between BT (Begin Text) and ET (End Text) markers
    const textBlocks: string[] = [];
    const btEtRegex = /BT(.*?)ET/gs;
    let match;
    
    while ((match = btEtRegex.exec(cleanContent)) !== null) {
      const textBlock = match[1];
      
      // Extract text using various PDF text operators
      const textMatches = textBlock.match(/\[(.*?)\]|\/([A-Za-z0-9]+)\s+(\d+)\s+Tf/g);
      if (textMatches) {
        textMatches.forEach(tm => {
          // Clean up text content
          const cleaned = tm
            .replace(/^\[|\]$/g, '') // Remove brackets
            .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8))) // Convert octal escapes
            .replace(/\\[()\\]/g, match => match.charAt(1)) // Handle escaped characters
            .replace(/\((.*?)\)/g, '$1') // Extract text in parentheses
            .trim();
          
          if (cleaned) {
            textBlocks.push(cleaned);
          }
        });
      }
    }

    // If no text found between BT/ET, try alternative methods
    if (textBlocks.length === 0) {
      // Look for text in parentheses
      const parenthesesText = cleanContent.match(/\((.*?)\)/g);
      if (parenthesesText) {
        textBlocks.push(...parenthesesText.map(t => 
          t.slice(1, -1)
           .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
           .replace(/\\[()\\]/g, match => match.charAt(1))
        ));
      }

      // Look for text in square brackets
      const bracketText = cleanContent.match(/\[(.*?)\]/g);
      if (bracketText) {
        textBlocks.push(...bracketText.map(t => 
          t.slice(1, -1)
           .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
           .replace(/\\[()\\]/g, match => match.charAt(1))
        ));
      }
    }

    // Join text blocks and clean up
    let extractedText = textBlocks.join(' ')
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
      .trim();

    return extractedText || "No readable text content found in PDF";
  } catch (error) {
    console.error("[PDF_TEXT_EXTRACTION_ERROR]", error);
    return "Failed to extract text from PDF";
  }
}

async function extractDocumentContent(content: string, fileType: string): Promise<string> {
  try {
    // For base64 content
    if (content.includes('base64,')) {
      const base64Data = content.split('base64,')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      // For PDF files, extract text
      if (fileType.includes('pdf')) {
        const text = buffer.toString('utf-8');
        const textContent = extractTextFromPDFContent(text);
        return textContent;
      }
      
      // For text-based files
      if (fileType.includes('text') || fileType.includes('json') || fileType.includes('javascript')) {
        return buffer.toString('utf-8');
      }

      // For other file types, try to extract text
      try {
        return buffer.toString('utf-8')
          .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
          .trim();
      } catch {
        return "File type not supported for text extraction";
      }
    }

    // For direct base64 content
    const buffer = Buffer.from(content, 'base64');
    
    if (fileType.includes('pdf')) {
      const text = buffer.toString('utf-8');
      return extractTextFromPDFContent(text);
    }
    
    // For text-based files
    if (fileType.includes('text') || fileType.includes('json') || fileType.includes('javascript')) {
      return buffer.toString('utf-8');
    }

    // For other file types, try to extract text
    try {
      return buffer.toString('utf-8')
        .replace(/[^\x20-\x7E\n]/g, '')
        .trim();
    } catch {
      return "File type not supported for text extraction";
    }
  } catch (error) {
    console.error("[CONTENT_EXTRACTION_ERROR]", error);
    return "Failed to extract document content";
  }
}

function sanitizeContent(content: string): string {
  return content
    // Remove non-printable characters except newlines and tabs
    .replace(/[^\x20-\x7E\n\t]/g, '')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Replace multiple newlines with double newline
    .replace(/\n{3,}/g, '\n\n')
    // Remove any remaining problematic characters
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    // Trim whitespace
    .trim();
}

function createContentSummary(content: string, maxLength: number): string {
  const sanitized = sanitizeContent(content);
  
  if (sanitized.length <= maxLength) {
    return sanitized;
  }

  // Get first and last parts
  const firstPart = sanitized.slice(0, Math.floor(maxLength * 0.7)); // 70% from start
  const lastPart = sanitized.slice(-Math.floor(maxLength * 0.3)); // 30% from end

  return `${firstPart}\n\n[...Content truncated (${sanitized.length} characters total)...]\n\n${lastPart}`;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!groq) {
      return NextResponse.json(
        { error: "AI service is not available" },
        { status: 503 }
      );
    }

    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get document
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

    // Get message from request
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { message } = body;
    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Extract document content based on file type
    const extractedContent = await extractDocumentContent(document.content, document.fileType);
    
    if (extractedContent.startsWith("Failed to")) {
      return NextResponse.json(
        { error: extractedContent },
        { status: 400 }
      );
    }

    // Create a summary of the content to stay within token limits
    const contentSummary = createContentSummary(extractedContent, SUMMARY_LENGTH);

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are analyzing the document "${document.title}". Here's the extracted content:

${contentSummary}

Instructions:
1. Provide accurate, helpful responses based on the available content
2. If content is truncated, focus on the visible portions while acknowledging limitations
3. Keep responses clear and concise
4. Use markdown formatting for better readability
5. If you need specific sections not shown, mention this in your response`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        model: "mixtral-8x7b-32768",
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      if (!completion?.choices?.[0]?.message?.content) {
        throw new Error("No response generated from AI service");
      }

      const response = completion.choices[0].message.content;

      try {
        // Create chat session
        const chat = await prisma.chat.create({
          data: {
            userId,
            documentId: document.id,
          },
        });

        // Save messages
        await prisma.$transaction([
          prisma.message.create({
            data: {
              content: message,
              role: "user",
              chatId: chat.id,
            },
          }),
          prisma.message.create({
            data: {
              content: response,
              role: "assistant",
              chatId: chat.id,
            },
          }),
        ]);
      } catch (dbError) {
        console.error("[DB_ERROR] Failed to save chat:", dbError);
      }

      return NextResponse.json({ response });
    } catch (groqError: any) {
      console.error("[GROQ_ERROR]", groqError);
      
      if (groqError.status === 413 || (groqError.error?.error?.code === 'rate_limit_exceeded')) {
        return NextResponse.json(
          { 
            error: "Content too large",
            details: "Try asking about specific sections or requesting a shorter summary."
          },
          { status: 413 }
        );
      }
      
      return NextResponse.json(
        { 
          error: "AI service error",
          details: groqError instanceof Error ? groqError.message : "Failed to process request"
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("[CHAT_ERROR]", error);
    
    let errorMessage = "Failed to process chat message";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("GROQ_API_KEY")) {
        errorMessage = "AI service not properly configured";
        statusCode = 503;
      } else if (error.message.includes("AI service")) {
        errorMessage = error.message;
        statusCode = 503;
      } else if (error.message.includes("prisma")) {
        errorMessage = "Database error";
        statusCode = 500;
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: statusCode }
    );
  }
} 