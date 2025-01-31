import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, FileText, RefreshCw, Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
}

interface PDFContentProps {
  documentUrl: string;
  onContentExtracted?: (content: string) => void;
  className?: string;
}

export function PDFContent({ documentUrl, onContentExtracted, className }: PDFContentProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<PDFMetadata | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;

  const extractContent = async (retry = false) => {
    try {
      setIsLoading(true);
      setError(null);

      if (retry) {
        setRetryCount(prev => prev + 1);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retryCount)));
      }

      const response = await fetch(`/api/documents/extract-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: documentUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract PDF content');
      }

      const data = await response.json();
      setContent(data.content);
      setMetadata(data.metadata);
      setPageCount(data.pageCount);
      onContentExtracted?.(data.content);
    } catch (error) {
      console.error('Error extracting PDF content:', error);
      setError(error instanceof Error ? error.message : 'Failed to extract content from PDF');
      
      if (retryCount < MAX_RETRIES) {
        await extractContent(true);
      } else {
        toast({
          title: "Error",
          description: "Failed to extract content from the document. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (documentUrl) {
      setRetryCount(0);
      extractContent();
    }
  }, [documentUrl]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn("flex items-center justify-center p-8", className)}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-primary/20"></div>
            <Loader2 className="w-12 h-12 animate-spin text-primary absolute inset-0" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {retryCount > 0 ? `Retrying (${retryCount}/${MAX_RETRIES})...` : 'Extracting content...'}
          </p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn("flex items-center justify-center p-8", className)}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Content Extraction Failed</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setRetryCount(0);
              extractContent();
            }}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </motion.div>
    );
  }

  if (!content) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn("flex items-center justify-center p-8", className)}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <FileText className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">No Content Found</h3>
            <p className="text-sm text-muted-foreground">
              No readable content was found in this document.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn("space-y-4", className)}
    >
      {metadata && Object.values(metadata).some(Boolean) && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Book className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium">Document Information</h3>
          </div>
          <div className="grid gap-2 text-sm">
            {metadata.title && (
              <div>
                <span className="font-medium">Title:</span> {metadata.title}
              </div>
            )}
            {metadata.author && (
              <div>
                <span className="font-medium">Author:</span> {metadata.author}
              </div>
            )}
            {metadata.subject && (
              <div>
                <span className="font-medium">Subject:</span> {metadata.subject}
              </div>
            )}
            {metadata.keywords && (
              <div>
                <span className="font-medium">Keywords:</span> {metadata.keywords}
              </div>
            )}
            <div>
              <span className="font-medium">Pages:</span> {pageCount}
            </div>
          </div>
        </div>
      )}

      <div className="bg-background rounded-lg p-6 shadow-sm">
        <pre className="whitespace-pre-wrap text-sm leading-relaxed">
          {content}
        </pre>
      </div>
    </motion.div>
  );
} 