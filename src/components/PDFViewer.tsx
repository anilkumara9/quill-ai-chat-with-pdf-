"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, Eye, EyeOff, Maximize, Minimize, Loader2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PDFViewerProps {
  documentId: string;
  title?: string;
  onDownload: () => void;
  onShare: () => void;
  className?: string;
}

export function PDFViewer({
  documentId,
  title = "Document",
  onDownload,
  onShare,
  className
}: PDFViewerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const fetchPDF = async () => {
      try {
        setError(null);
        setIsLoading(true);

        const response = await fetch(`/api/documents/${documentId}/content`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch document content');
        }

        const data = await response.json();
        
        if (!data.content) {
          throw new Error('Document content is empty');
        }

        // Create a blob URL for the PDF content
        const blob = new Blob([data.content], { type: data.fileType });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);

      } catch (error) {
        console.error('Error fetching PDF:', error);
        setError(error instanceof Error ? error.message : 'Failed to load document');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPDF();

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [documentId]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError("Failed to load PDF document");
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  return (
    <motion.div 
      layout
      className={cn(
        'flex flex-col transition-all duration-300 ease-in-out bg-background',
        isFullscreen ? 'fixed inset-0 z-50' : 'h-full',
        className,
        {
          'w-[55%]': isExpanded && !isFullscreen,
          'w-[50px]': !isExpanded && !isFullscreen,
        }
      )}
    >
      <div className={cn(
        "flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "border-b border-border/40 transition-colors duration-200"
      )}>
        <div className={cn('flex items-center gap-3 overflow-hidden', {
          'opacity-0 w-0': !isExpanded && !isFullscreen
        })}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-medium text-sm truncate">{title}</h2>
            <p className="text-xs text-muted-foreground">PDF Document</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {(isExpanded || isFullscreen) && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleZoomOut}
                className="h-8 w-8 rounded-full hover:bg-primary/10"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <div className="text-xs font-medium px-2">
                {Math.round(scale * 100)}%
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleZoomIn}
                className="h-8 w-8 rounded-full hover:bg-primary/10"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleRotate}
                className="h-8 w-8 rounded-full hover:bg-primary/10"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onDownload}
                className="h-8 w-8 rounded-full hover:bg-primary/10"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleFullscreen}
                className="h-8 w-8 rounded-full hover:bg-primary/10"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>
            </>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 rounded-full hover:bg-primary/10"
          >
            {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        {(isExpanded || isFullscreen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex-1 bg-muted/30"
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-primary/20"></div>
                    <Loader2 className="w-12 h-12 animate-spin text-primary absolute inset-0" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Loading PDF...</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 p-6 max-w-md text-center">
                  <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-destructive" />
                  </div>
                  <h3 className="font-semibold">Failed to Load PDF</h3>
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            {pdfUrl && (
              <iframe
                ref={iframeRef}
                src={`https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
                className={cn(
                  "w-full h-full border-0 bg-white transition-transform duration-300",
                  "transform-gpu"
                )}
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center'
                }}
                title={title}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}