import { geminiModel, geminiVisionModel, groqClient } from './ai-clients';
import { AI_MODELS } from './ai-config';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 3600000; // 1 hour in milliseconds
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

interface RateLimitInfo {
    resetTime: number;
    currentModel: 'gemini' | 'groq';
}

class RateLimitManager {
    private static rateLimits: Map<string, RateLimitInfo> = new Map();

    static isRateLimited(model: string): boolean {
        const info = this.rateLimits.get(model);
        if (!info) return false;
        return Date.now() < info.resetTime;
    }

    static setRateLimit(model: string, currentModel: 'gemini' | 'groq'): void {
        this.rateLimits.set(model, {
            resetTime: Date.now() + RATE_LIMIT_WINDOW,
            currentModel
        });
    }

    static getAlternativeModel(currentModel: 'gemini' | 'groq'): 'gemini' | 'groq' {
        return currentModel === 'gemini' ? 'groq' : 'gemini';
    }
}

export class AIService {
    private static async retryWithExponentialBackoff<T>(
        operation: () => Promise<T>,
        retryCount: number = 0
    ): Promise<T> {
        try {
            return await operation();
        } catch (error: any) {
            if (retryCount >= MAX_RETRIES) {
                throw error;
            }

            const isRateLimit = error.message?.toLowerCase().includes('rate limit');
            if (isRateLimit) {
                throw error; // Let rate limit errors be handled by the caller
            }

            const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.retryWithExponentialBackoff(operation, retryCount + 1);
        }
    }

    private static async handleRateLimit(
        operation: () => Promise<string>,
        model: 'gemini' | 'groq'
    ): Promise<string> {
        try {
            return await this.retryWithExponentialBackoff(operation);
        } catch (error: any) {
            const isRateLimit = error.message?.toLowerCase().includes('rate limit');
            if (isRateLimit) {
                RateLimitManager.setRateLimit(model, model);
                const alternativeModel = RateLimitManager.getAlternativeModel(model);
                
                // If both models are rate limited, throw an error
                if (RateLimitManager.isRateLimited(alternativeModel)) {
                    throw new Error('All AI models are currently rate limited. Please try again later.');
                }

                // Try with the alternative model
                return await this.generateTextCompletion(
                    `[Using ${alternativeModel} as fallback due to rate limit] ${error.message}`,
                    alternativeModel === 'groq'
                );
            }
            throw error;
        }
    }

    static async generateTextCompletion(prompt: string, useGroq: boolean = false): Promise<string> {
        const model = useGroq ? 'groq' : 'gemini';
        
        if (RateLimitManager.isRateLimited(model)) {
            const alternativeModel = RateLimitManager.getAlternativeModel(model);
            if (RateLimitManager.isRateLimited(alternativeModel)) {
                throw new Error('All AI models are currently rate limited. Please try again later.');
            }
            return this.generateTextCompletion(prompt, alternativeModel === 'groq');
        }

        return this.handleRateLimit(async () => {
            if (useGroq) {
                const completion = await groqClient.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: AI_MODELS.GROQ.CHAT,
                    temperature: 0.7,
                    max_tokens: 2048,
                });
                return completion.choices[0]?.message?.content || '';
            } else {
                const result = await geminiModel.generateContent(prompt);
                const response = await result.response;
                return response.text();
            }
        }, model);
    }

    static async analyzeImage(image: string, prompt: string): Promise<string> {
        if (RateLimitManager.isRateLimited('gemini')) {
            throw new Error('Image analysis is currently rate limited. Please try again later.');
        }

        return this.handleRateLimit(async () => {
            const result = await geminiVisionModel.generateContent([prompt, image]);
            const response = await result.response;
            return response.text();
        }, 'gemini');
    }

    static async analyzePDF(text: string, useGroq: boolean = false): Promise<string> {
        const prompt = `Please analyze the following text from a PDF document and provide a comprehensive summary: ${text}`;
        return this.generateTextCompletion(prompt, useGroq);
    }

    static async generateQuestions(context: string, useGroq: boolean = false): Promise<string> {
        const prompt = `Based on the following context, generate relevant questions that could be asked: ${context}`;
        return this.generateTextCompletion(prompt, useGroq);
    }

    static async chatWithAI(
        messages: { role: string; content: string }[],
        useGroq: boolean = false
    ): Promise<string> {
        const model = useGroq ? 'groq' : 'gemini';
        
        if (RateLimitManager.isRateLimited(model)) {
            const alternativeModel = RateLimitManager.getAlternativeModel(model);
            if (RateLimitManager.isRateLimited(alternativeModel)) {
                throw new Error('All AI models are currently rate limited. Please try again later.');
            }
            return this.chatWithAI(messages, alternativeModel === 'groq');
        }

        return this.handleRateLimit(async () => {
            if (useGroq) {
                const completion = await groqClient.chat.completions.create({
                    messages,
                    model: AI_MODELS.GROQ.CHAT,
                    temperature: 0.7,
                    max_tokens: 2048,
                });
                return completion.choices[0]?.message?.content || '';
            } else {
                const prompt = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
                const result = await geminiModel.generateContent(prompt);
                const response = await result.response;
                return response.text();
            }
        }, model);
    }
}
