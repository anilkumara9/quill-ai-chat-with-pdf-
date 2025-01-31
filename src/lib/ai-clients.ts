import { GoogleGenerativeAI } from '@google/generative-ai';
import { Groq } from 'groq-sdk';
import { AI_CONFIG, AI_MODELS } from './ai-config';

// Initialize Gemini
export const geminiAI = new GoogleGenerativeAI(AI_CONFIG.GEMINI_API_KEY!);
export const geminiModel = geminiAI.getGenerativeModel({ model: AI_MODELS.GEMINI.CHAT });
export const geminiVisionModel = geminiAI.getGenerativeModel({ model: AI_MODELS.GEMINI.VISION });

// Initialize Groq
export const groqClient = new Groq({
    apiKey: AI_CONFIG.GROQ_API_KEY,
});
