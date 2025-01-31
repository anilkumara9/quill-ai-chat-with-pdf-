"use client";

import React, { useRef, useCallback } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  loading = false,
  disabled = false,
  placeholder = "Type a message...",
  className
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || loading || disabled) return;
    onSubmit();
  }, [value, loading, disabled, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || loading}
        variant="modern"
        className="pr-20"
      />
      <Button 
        type="submit"
        size="sm"
        variant="ghost"
        disabled={disabled || loading || !value.trim()}
        className={cn(
          "absolute right-1 top-1 bottom-1 px-2",
          loading && "opacity-50 cursor-not-allowed"
        )}
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
} 