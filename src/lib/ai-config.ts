export const AI_CONFIG = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
} as const;

export const AI_MODELS = {
    GROQ: {
        CHAT: 'mixtral-8x7b-32768',
        COMPLETION: 'mixtral-8x7b-32768',
    },
    GEMINI: {
        CHAT: 'gemini-pro',
        VISION: 'gemini-pro-vision',
    },
} as const;
