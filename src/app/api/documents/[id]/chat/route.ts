import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Groq } from "groq-sdk";
import { z } from "zod";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const messageSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  documentContent: z.string(),
  selectedContext: z.string().nullable(),
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

    // Validate document access
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
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found or access denied" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = messageSchema.parse(body);

    // Prepare conversation history
    const conversationHistory = validatedData.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Prepare system message with document context
    const systemMessage = {
      role: "system",
      content: `You are a helpful AI assistant analyzing a document. Here's the document content to reference:

${validatedData.documentContent}

When answering questions:
1. Base your answers ONLY on the document content provided above
2. If you can't find the answer in the document, say "I cannot find information about that in the document" and explain what you looked for
3. Use markdown formatting for better readability
4. When quoting from the document, use ">" to format quotes
5. Be concise but thorough
6. If the document appears to be corrupted or empty, indicate that there might be an issue with the document processing
7. For summaries, break down the content into clear sections with headings
8. Always maintain context between messages in the conversation

Remember: You have access to the full document content. If you're asked to summarize or analyze it, you should be able to do so based on the content provided above.`,
    };

    // Get completion from Groq
    const completion = await groq.chat.completions.create({
      messages: [systemMessage, ...conversationHistory],
      model: "mixtral-8x7b-32768",
      temperature: 0.7,
      max_tokens: 4096,
      top_p: 1,
      stream: false,
    });

    const aiResponse = completion.choices[0]?.message?.content || "No response generated";

    // Create or update chat and message in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find existing chat
      let chat = await tx.chat.findFirst({
        where: {
          userId,
          documentId: params.id,
        },
      });

      // Create chat if it doesn't exist
      if (!chat) {
        chat = await tx.chat.create({
          data: {
            userId,
            documentId: params.id,
          },
        });
      } else {
        // Update existing chat's timestamp
        chat = await tx.chat.update({
          where: { id: chat.id },
          data: { updatedAt: new Date() },
        });
      }

      // Create message
      const message = await tx.message.create({
        data: {
          content: aiResponse,
          role: "assistant",
          chatId: chat.id,
        },
      });

      return { chat, message };
    });

    return NextResponse.json({
      messageId: result.message.id,
      message: result.message.content,
    });
  } catch (error) {
    console.error("[CHAT_ERROR]", error);
    return NextResponse.json(
      { 
        error: "Failed to process chat message",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 