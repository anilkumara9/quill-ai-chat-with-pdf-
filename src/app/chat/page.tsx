"use client";

import { useState, useCallback, useEffect } from "react";
import { SendHorizontal, AlertCircle } from "lucide-react";
import { ChatMessage } from "@/components/chat-message";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ErrorResponse {
  error: string;
  type?: string;
  retryAfter?: number;
}

const INITIAL_BACKOFF_MS = 1000;  // Start with 1 second
const MAX_BACKOFF_MS = 30000;     // Max 30 seconds
const MAX_RETRIES = 3;

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [backoffMs, setBackoffMs] = useState(INITIAL_BACKOFF_MS);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const { toast } = useToast();

  // Clear error when user starts typing
  useEffect(() => {
    if (input.trim() && error) {
      setError(null);
    }
  }, [input, error]);

  // Show countdown timer for rate limit
  useEffect(() => {
    if (!retryAfter) return;

    const interval = setInterval(() => {
      setRetryAfter(prev => {
        if (!prev || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [retryAfter]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't allow new messages if we're in a rate limit cooldown
    if (retryAfter) {
      toast({
        title: "Please wait",
        description: `Please wait ${Math.ceil(retryAfter)} seconds before sending another message`,
        variant: "destructive",
      });
      return;
    }

    const now = Date.now();
    if (now - lastMessageTime < backoffMs) {
      toast({
        title: "Please wait",
        description: `Please wait ${Math.ceil(backoffMs/1000)} seconds before sending another message`,
        variant: "destructive",
      });
      return;
    }

    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    if (trimmedInput.length > 4000) {
      toast({
        title: "Message too long",
        description: "Please keep your message under 4000 characters",
        variant: "destructive",
      });
      return;
    }

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: trimmedInput }]);
    setIsLoading(true);
    setLastMessageTime(now);

    try {
      let retries = 0;
      let success = false;

      while (retries < MAX_RETRIES && !success) {
        try {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: trimmedInput }),
          });

          const data = await response.json() as { message?: string } & ErrorResponse;

          if (!response.ok) {
            // Handle rate limits specially
            if (response.status === 429) {
              const retryAfterHeader = response.headers.get('Retry-After');
              const waitTime = parseInt(retryAfterHeader || '60', 10);
              
              if (data.type === 'GROQ_RATE_LIMIT') {
                // For Groq rate limits, show the full error and don't retry
                setRetryAfter(waitTime);
                throw new Error(data.error);
              } else {
                // For internal rate limits, use exponential backoff
                setBackoffMs(Math.min(backoffMs * 2, MAX_BACKOFF_MS));
                throw new Error(`Rate limit exceeded. Please try again in ${Math.ceil(waitTime)} seconds.`);
              }
            }
            throw new Error(data.error || "Failed to get response");
          }

          if (!data.message) {
            throw new Error("Invalid response format");
          }

          setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
          setBackoffMs(INITIAL_BACKOFF_MS); // Reset backoff on success
          success = true;
        } catch (err) {
          if (err instanceof Error && err.message.includes("Groq API rate limit")) {
            throw err; // Don't retry Groq rate limit errors
          }
          if (retries === MAX_RETRIES - 1) throw err;
          retries++;
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          setBackoffMs(Math.min(backoffMs * 2, MAX_BACKOFF_MS));
        }
      }
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, lastMessageTime, backoffMs, retryAfter, toast]);

  return (
    <div className="container mx-auto max-w-4xl py-8">
      {error && (
        <div className="mb-4 rounded-lg bg-destructive/15 p-4 text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
            {retryAfter && (
              <p className="text-sm ml-2">
                (Retry in {Math.ceil(retryAfter)} seconds)
              </p>
            )}
          </div>
        </div>
      )}
      <div className="rounded-lg border bg-background shadow">
        <div className="h-[600px] overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Welcome to Quill Chat!</h3>
                <p className="text-muted-foreground">
                  Ask me anything and I'll help you out.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <ChatMessage key={index} {...message} />
              ))}
              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              )}
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex items-center border-t p-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-background px-4 py-2 focus:outline-none disabled:opacity-50"
            disabled={isLoading}
            maxLength={4000}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="ml-4 rounded-full p-2 text-primary hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SendHorizontal className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
