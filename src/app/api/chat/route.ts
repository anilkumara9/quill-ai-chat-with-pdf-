import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { z } from "zod";
import { prisma } from "@/lib/db";

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
});

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
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

    // Prepare system message
    const systemMessage = {
      role: "system",
      content: `You are a helpful AI assistant with expertise in coding, data analysis, and general knowledge. You can:
1. Generate code in various programming languages
2. Help with data analysis and visualization
3. Explain complex concepts in simple terms
4. Answer general questions on any topic

When providing code:
- Include necessary imports and dependencies
- Add helpful comments
- Explain the code's functionality
- Consider best practices and performance

When discussing data analysis:
- Suggest appropriate visualization types
- Recommend suitable libraries and tools
- Consider statistical significance
- Explain methodology and assumptions

Always maintain a helpful and professional tone while being clear and concise.`,
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
          documentId: null, // Regular chat mode
        },
      });

      // Create chat if it doesn't exist
      if (!chat) {
        chat = await tx.chat.create({
          data: {
            userId,
            documentId: null,
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
      message: aiResponse,
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
