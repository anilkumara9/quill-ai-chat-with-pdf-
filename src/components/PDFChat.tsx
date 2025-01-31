"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, Bot, Sparkles, Search, Wand2, Brain, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

interface PDFChatProps {
  documentId?: string;
  hideHeader?: boolean;
}

const EXAMPLE_QUESTIONS = [
  {
    icon: <FileText className="w-4 h-4" />,
    text: "Summarize document",
    query: "Please provide a comprehensive summary of this document, highlighting the main points and key takeaways."
  },
  {
    icon: <Brain className="w-4 h-4" />,
    text: "Deep analysis",
    query: "Perform a detailed analysis of this document, including key concepts, arguments, and conclusions."
  },
  {
    icon: <Wand2 className="w-4 h-4" />,
    text: "Explain simply",
    query: "Explain the main concepts of this document in simple, easy-to-understand terms."
  },
  {
    icon: <Search className="w-4 h-4" />,
    text: "Find key insights",
    query: "What are the most important insights and findings presented in this document?"
  }
];

export function PDFChat({ documentId: propDocumentId, hideHeader = false }: PDFChatProps) {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  
  const documentId = propDocumentId || params.id;

  // Fetch document content on mount
  useEffect(() => {
    async function fetchDocumentContent() {
      try {
        const response = await fetch(`/api/documents/${documentId}/content`);
        if (!response.ok) {
          throw new Error('Failed to fetch document content');
        }
        const data = await response.json();
        setDocumentContent(data.content);
      } catch (error) {
        console.error('Error fetching document content:', error);
        toast({
          title: "Error",
          description: "Failed to load document content. Please try again.",
          variant: "destructive",
        });
      }
    }

    if (documentId) {
      fetchDocumentContent();
    }
  }, [documentId, toast]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Initial welcome message with delay for animation
  useEffect(() => {
    if (messages.length === 0) {
      const timer = setTimeout(() => {
        setMessages([{
          role: "assistant",
          content: "👋 Hello! I'm your AI research assistant. I've analyzed your document and I'm ready to help you understand it better. Feel free to ask me anything about the content, and I'll provide detailed, accurate responses. You can ask for summaries, explanations, or specific details from any part of the document.",
          timestamp: new Date()
        }]);
        setShowWelcome(false);
        // Focus the input after welcome message
        inputRef.current?.focus();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Thinking animation
  useEffect(() => {
    if (isLoading) {
      setIsThinking(true);
      const timer = setTimeout(() => setIsThinking(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !documentContent) return;

    const userMessage = { 
      role: "user" as const, 
      content: input.trim(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/documents/${documentId}/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          documentContent: documentContent,
          selectedContext: null
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || "Failed to send message");
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: "assistant" as const, 
        content: data.message,
        timestamp: new Date()
      }]);

      // Focus input after response
      inputRef.current?.focus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send message";
      console.error("Chat Error:", err);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="relative flex flex-col h-full w-full">
      {/* Main Chat Area */}
      <div className="flex-1 w-full overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex flex-col min-h-full">
            <div className="flex-1 w-full max-w-5xl mx-auto px-4">
              <div className="flex flex-col gap-4 py-4 pb-[200px]">
                {showWelcome && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center py-12"
                  >
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
                        <div className="relative w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                          <Brain className="w-6 h-6 text-purple-500" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          Initializing AI Assistant
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Analyzing your document and preparing responses...
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <AnimatePresence mode="popLayout" initial={false}>
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChatMessage 
                        message={message}
                        isLastMessage={index === messages.length - 1}
                      />
                    </motion.div>
                  ))}

                  {isLoading && (
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center py-2"
                    >
                      <div className={cn(
                        "flex items-center gap-3 px-4 py-2 rounded-full",
                        "bg-purple-50 dark:bg-purple-900/20",
                        "text-sm text-purple-600 dark:text-purple-300",
                        "transition-all duration-500",
                        isThinking ? "opacity-100" : "opacity-70"
                      )}>
                        <div className="relative w-4 h-4">
                          <div className="absolute inset-0 rounded-full bg-purple-400/50 animate-ping" />
                          <Brain className="w-4 h-4 relative animate-pulse" />
                        </div>
                        <span>AI is analyzing your question...</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 w-full bg-gradient-to-t from-background via-background to-transparent pt-24">
        <div className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="w-full max-w-5xl mx-auto px-4 py-4">
            <form onSubmit={handleSubmit} className="relative">
              <div className="relative flex items-center gap-2 w-full p-2 rounded-xl border-2 bg-background shadow-sm hover:shadow-md transition-all duration-200 dark:border-gray-800 focus-within:border-purple-600 dark:focus-within:border-purple-500">
                {/* Search Icon */}
                <div className="pl-2 flex-shrink-0">
                  <Search className="w-5 h-5 text-muted-foreground" />
                </div>

                {/* Input */}
                <Input
                  ref={inputRef}
                  placeholder="Ask anything about your PDF document..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className={cn(
                    "flex-1 min-w-0 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
                    "placeholder:text-muted-foreground",
                    "text-base"
                  )}
                />

                {/* Send Button */}
                <div className="flex-shrink-0 pr-2">
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={isLoading || !input.trim()}
                    className={cn(
                      "h-9 w-9 rounded-lg bg-purple-600 hover:bg-purple-700 text-white",
                      "shadow-sm hover:shadow-md transition-all duration-200",
                      "hover:scale-105 active:scale-95",
                      "disabled:opacity-50 disabled:hover:scale-100",
                      !input.trim() && "opacity-0 scale-90"
                    )}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* Examples Popup */}
                {!input.trim() && !isLoading && messages.length <= 1 && (
                  <div className="absolute -top-[240px] left-0 right-0 w-full bg-background rounded-xl shadow-lg border dark:border-gray-800 p-4">
                    <div className="text-sm font-medium text-foreground mb-3">
                      Ask questions about your PDF document:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {EXAMPLE_QUESTIONS.map((question, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setInput(question.query)}
                          className={cn(
                            "text-sm px-3 py-2.5 rounded-lg text-left transition-all duration-200",
                            "bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30",
                            "text-purple-600 dark:text-purple-300",
                            "flex items-center gap-2 group w-full"
                          )}
                        >
                          <span className="text-purple-500 dark:text-purple-400">
                            {question.icon}
                          </span>
                          <span className="flex-1">{question.text}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      Click any suggestion or type your own question
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 