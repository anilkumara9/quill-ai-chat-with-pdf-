"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  Send, 
  Bot, 
  FileText, 
  Code, 
  BarChart, 
  Brain,
  SwitchCamera
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

interface ChatInterfaceProps {
  documentId?: string;
  hideHeader?: boolean;
}

const PDF_EXAMPLE_QUESTIONS = [
  {
    icon: <FileText className="w-4 h-4" />,
    text: "Summarize document",
    query: "Please provide a comprehensive summary of this document, highlighting the main points and key takeaways."
  },
  {
    icon: <Brain className="w-4 h-4" />,
    text: "Deep analysis",
    query: "Perform a detailed analysis of this document, including key concepts, arguments, and conclusions."
  }
];

const REGULAR_EXAMPLE_QUESTIONS = [
  {
    icon: <Code className="w-4 h-4" />,
    text: "Generate code",
    query: "Can you help me write a Python function to sort a list of dictionaries by a specific key?"
  },
  {
    icon: <BarChart className="w-4 h-4" />,
    text: "Data analysis",
    query: "How can I create a data visualization dashboard using Python and Streamlit?"
  }
];

export function ChatInterface({ documentId: propDocumentId, hideHeader = false }: ChatInterfaceProps) {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [isPDFMode, setIsPDFMode] = useState(!!propDocumentId);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  const documentId = propDocumentId || params?.id;

  // Fetch document content if in PDF mode
  useEffect(() => {
    async function fetchDocumentContent() {
      if (!documentId || !isPDFMode) return;
      
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

    fetchDocumentContent();
  }, [documentId, isPDFMode, toast]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const timer = setTimeout(() => {
        setMessages([{
          role: "assistant",
          content: isPDFMode 
            ? "👋 Hello! I'm your AI research assistant. I've analyzed your document and I'm ready to help you understand it better. Feel free to ask me anything about the content."
            : "👋 Hello! I'm your AI assistant. I can help you with coding, data analysis, and general questions. Feel free to ask me anything!",
          timestamp: new Date()
        }]);
        setShowWelcome(false);
        inputRef.current?.focus();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isPDFMode]);

  // Manage suggestions visibility
  useEffect(() => {
    if (messages.length <= 1 && !input.trim() && !isLoading) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [messages.length, input, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { 
      role: "user" as const, 
      content: input.trim(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const endpoint = isPDFMode 
        ? `/api/documents/${documentId}/chat`
        : '/api/chat';
        
      const body = isPDFMode 
        ? { 
            messages: [...messages, userMessage],
            documentContent: documentContent,
            selectedContext: null
          }
        : {
            messages: [...messages, userMessage]
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  const handleSuggestionClick = (query: string) => {
    setInput(query);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const toggleMode = () => {
    setIsPDFMode(!isPDFMode);
    setMessages([]);
    setShowWelcome(true);
    setShowSuggestions(true);
  };

  return (
    <div className="relative flex flex-col h-full w-full">
      {/* Main Chat Area */}
      <div className="flex-1 w-full overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex flex-col min-h-full">
            <div className="flex-1 w-full max-w-5xl mx-auto px-4">
              <div className="flex flex-col gap-4 py-4 pb-[200px]">
                <AnimatePresence mode="wait">
                  {showWelcome && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center justify-center py-12"
                    >
                      <div className="flex flex-col items-center gap-4 text-center">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
                          <div className="relative w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                            {isPDFMode ? (
                              <FileText className="w-6 h-6 text-purple-500" />
                            ) : (
                              <Bot className="w-6 h-6 text-purple-500" />
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <h3 className="text-lg font-semibold text-foreground">
                            {isPDFMode ? "PDF Chat Mode" : "Regular Chat Mode"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {isPDFMode 
                              ? "Ask questions about your PDF document..."
                              : "Ask me anything about coding, data analysis, or general topics..."}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChatMessage message={message} isLastMessage={index === messages.length - 1} />
                    </motion.div>
                  ))}

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-center py-4"
                    >
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Chat Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-20">
        <div className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="w-full max-w-5xl mx-auto px-4 py-4">
            <form onSubmit={handleSubmit} className="relative">
              {/* Suggestions Panel */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-full mb-4 left-0 right-0 w-full bg-background/95 backdrop-blur-sm rounded-2xl shadow-lg border dark:border-gray-800 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-foreground">
                        {isPDFMode ? "Ask questions about your PDF:" : "Try these examples:"}
                      </h3>
                      <div className="text-xs text-muted-foreground">
                        Click any suggestion or type your own
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(isPDFMode ? PDF_EXAMPLE_QUESTIONS : REGULAR_EXAMPLE_QUESTIONS).map((question, index) => (
                        <motion.button
                          key={index}
                          type="button"
                          onClick={() => handleSuggestionClick(question.query)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left",
                            "bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30",
                            "text-purple-600 dark:text-purple-300",
                            "group hover:shadow-md transition-all duration-200"
                          )}
                        >
                          <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-500 dark:text-purple-400 group-hover:scale-110 transition-transform duration-200">
                            {question.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium mb-0.5">{question.text}</div>
                            <div className="text-xs text-purple-500/70 dark:text-purple-400/70 truncate">
                              {question.query}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Field */}
              <div className="relative flex items-center gap-2 w-full p-2 rounded-full border-2 bg-background shadow-sm hover:shadow-md transition-all duration-200 dark:border-gray-800 focus-within:border-purple-600 dark:focus-within:border-purple-500">
                {/* Mode Toggle */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggleMode}
                  className="flex-shrink-0 h-9 w-9 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/20"
                  disabled={isLoading}
                >
                  {isPDFMode ? (
                    <FileText className="h-4 w-4 text-purple-600" />
                  ) : (
                    <Bot className="h-4 w-4 text-purple-600" />
                  )}
                </Button>

                {/* Input */}
                <div className="flex-1 min-w-0 relative">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={isPDFMode 
                      ? "Ask anything about your PDF document..."
                      : "Ask me about coding, data analysis, or anything else..."
                    }
                    disabled={isLoading}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground text-base py-2 h-auto"
                    style={{ minHeight: '44px', height: 'auto' }}
                  />
                </div>

                {/* Send Button */}
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !input.trim()}
                  className={cn(
                    "flex-shrink-0 h-9 w-9 rounded-full",
                    "bg-purple-600 hover:bg-purple-700 text-white",
                    "shadow-sm hover:shadow-md transition-all duration-200",
                    "hover:scale-105 active:scale-95",
                    "disabled:opacity-50 disabled:hover:scale-100",
                    !input.trim() && "opacity-0 scale-90"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Character Count */}
              {input.length > 0 && (
                <div className="absolute right-14 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {input.length}/4000
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 