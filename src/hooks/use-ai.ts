import { useState } from 'react';
import axios from 'axios';

interface UseAIOptions {
    onSuccess?: (response: string) => void;
    onError?: (error: Error) => void;
}

export function useAI(options: UseAIOptions = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const generateResponse = async (
        prompt: string | { role: string; content: string }[],
        type: 'text' | 'chat' | 'image' | 'pdf' = 'text',
        useGroq: boolean = false
    ) => {
        try {
            setIsLoading(true);
            setError(null);

            const { data } = await axios.post('/api/ai', {
                prompt,
                type,
                useGroq
            });

            options.onSuccess?.(data.response);
            return data.response;
        } catch (err: any) {
            const error = new Error(err.response?.data || 'Failed to generate AI response');
            setError(error);
            options.onError?.(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const analyzeImage = async (imageData: string, text?: string) => {
        return generateResponse({ image: imageData, text }, 'image');
    };

    const analyzePDF = async (pdfText: string, useGroq: boolean = false) => {
        return generateResponse(pdfText, 'pdf', useGroq);
    };

    const chat = async (messages: { role: string; content: string }[], useGroq: boolean = false) => {
        return generateResponse(messages, 'chat', useGroq);
    };

    return {
        generateResponse,
        analyzeImage,
        analyzePDF,
        chat,
        isLoading,
        error
    };
}
