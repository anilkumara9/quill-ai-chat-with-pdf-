"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import { Message } from "@/lib/types";
import { Bot, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface ChatMessageProps {
  message: Message;
  isLastMessage?: boolean;
}

export function ChatMessage({ message, isLastMessage }: ChatMessageProps) {
  const isUser = message.role === "user";
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Message content has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "group flex items-start gap-3 text-sm",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm"
        >
          <Bot className="w-5 h-5 text-white" />
        </motion.div>
      )}
      
      <motion.div 
        layout
        className={cn(
          "relative max-w-[85%] px-4 py-3 rounded-2xl transition-all duration-200",
          isUser 
            ? "bg-purple-600 text-white shadow-md hover:shadow-lg" 
            : "bg-secondary dark:bg-gray-800/50 shadow-sm hover:shadow-md",
          "dark:shadow-purple-900/5",
          "hover:-translate-y-0.5 transition-transform duration-200",
          isLastMessage && !isUser && "animate-pulse-once"
        )}
      >
        {/* Copy button */}
        <div className={cn(
          "absolute -right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          isUser ? "-right-2" : "-left-2"
        )}>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "h-8 w-8 rounded-lg bg-background/90 backdrop-blur hover:bg-background/95",
              "border shadow-sm",
              "text-muted-foreground hover:text-foreground",
              "transition-all duration-200"
            )}
            onClick={copyToClipboard}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        <ReactMarkdown
          className={cn(
            "prose dark:prose-invert max-w-none text-sm",
            "[&>p]:mb-2 [&>p:last-child]:mb-0 [&>p]:leading-relaxed",
            isUser && "text-white [&>p]:text-white/95"
          )}
          components={{
            ul: ({ children }) => (
              <ul className="my-2 space-y-2 list-none pl-0">
                {React.Children.map(children, (child) => (
                  <li className="flex items-start gap-2">
                    <span className={cn(
                      "text-lg leading-none select-none",
                      isUser ? "text-white/90" : "text-purple-600 dark:text-purple-400"
                    )}>▸</span>
                    {child}
                  </li>
                ))}
              </ul>
            ),
            a: ({ children, href }) => (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className={cn(
                  "no-underline hover:underline transition-colors duration-200",
                  isUser 
                    ? "text-white/95 hover:text-white" 
                    : "text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                )}
              >
                {children}
              </a>
            ),
            code: ({ node, inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              
              if (!inline && language) {
                return (
                  <div className="rounded-lg overflow-hidden my-3 bg-black/80 dark:bg-black/40 shadow-lg">
                    <div className="px-4 py-2 bg-black/20 border-b border-white/10 flex items-center justify-between">
                      <span className="text-xs text-white/80 font-mono">{language}</span>
                      <span className="text-xs text-white/60">Code snippet</span>
                    </div>
                    <SyntaxHighlighter
                      language={language}
                      style={oneDark}
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        background: 'transparent',
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                      }}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                );
              }
              
              return (
                <code 
                  className={cn(
                    "px-1.5 py-0.5 rounded text-sm font-mono transition-colors duration-200",
                    isUser 
                      ? "bg-white/20 text-white" 
                      : "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300"
                  )} 
                  {...props}
                >
                  {children}
                </code>
              );
            },
            p: ({ children }) => (
              <p className="mb-2 last:mb-0">{children}</p>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>

        {/* Timestamp */}
        {message.timestamp && (
          <div className={cn(
            "text-[10px] mt-1 opacity-0 group-hover:opacity-60 transition-opacity duration-200",
            isUser ? "text-right text-white/60" : "text-left text-muted-foreground"
          )}>
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
} 