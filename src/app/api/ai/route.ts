import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai-service';
import { auth } from '@clerk/nextjs';

export async function POST(req: NextRequest) {
    try {
        const { userId } = auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { prompt, type = 'text', useGroq = false } = body;

        if (!prompt) {
            return new NextResponse("Prompt is required", { status: 400 });
        }

        let response;
        switch (type) {
            case 'text':
                response = await AIService.generateTextCompletion(prompt, useGroq);
                break;
            case 'chat':
                response = await AIService.chatWithAI(prompt, useGroq);
                break;
            case 'image':
                response = await AIService.analyzeImage(prompt.image, prompt.text || 'Describe this image');
                break;
            case 'pdf':
                response = await AIService.analyzePDF(prompt, useGroq);
                break;
            default:
                return new NextResponse("Invalid type", { status: 400 });
        }

        return NextResponse.json({ response });
    } catch (error: any) {
        console.error('[AI ERROR]', error);
        return new NextResponse(error.message || "Internal Error", { status: 500 });
    }
}
