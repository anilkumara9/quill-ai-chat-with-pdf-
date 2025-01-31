import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileText, Download, Eye, EyeOff, Maximize, Minimize, Loader2, ZoomIn, ZoomOut, RotateCw, Share2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

interface PDFViewerProps {
  documentId: string;
  title?: string;
  onDownload?: () => void;
  onShare?: () => void;
  className?: string;
}

export function PDFViewer({
  documentId,
  title = "Document",
  onDownload,
  onShare,
  className
}: PDFViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setRotation(0);
  }, []);

  const reloadPDF = useCallback(async () => {
    if (retryCount >= MAX_RETRIES) {
      setError("Maximum retry attempts reached. Please try again later.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setRetryCount(prev => prev + 1);

    try {
      const response = await fetch(`/api/documents/${documentId}`);
      if (!response.ok) {
        throw new Error('Failed to verify document access');
      }

      if (iframeRef.current) {
        iframeRef.current.src = `/api/documents/${documentId}/view?t=${Date.now()}`;
      }
    } catch (error) {
      console.error('Error reloading PDF:', error);
      setError("Failed to reload PDF. Please check your connection and try again.");
      setIsLoading(false);
    }
  }, [documentId, retryCount]);

  useEffect(() => {
    setRetryCount(0);
  }, [documentId]);

  return (
    <TooltipProvider>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }}
        className={cn(
          "relative flex flex-col w-full max-w-4xl bg-background/95 backdrop-blur-sm border rounded-xl shadow-2xl",
          isFullscreen && "fixed inset-0 z-50 max-w-none rounded-none",
          className
        )}
      >
        <motion.div
          layout
          className="flex items-center justify-between p-4 border-b bg-background/50 backdrop-blur-sm rounded-t-xl"
        >
          <motion.div layout className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 hover:bg-primary/15 transition-colors"
            >
              <FileText className="w-5 h-5 text-primary" />
            </motion.div>
            <div className="flex flex-col">
              <motion.h2 layout className="font-semibold text-base truncate">{title}</motion.h2>
              {retryCount > 0 && (
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-xs text-muted-foreground"
                >
                  Attempt {retryCount}/{MAX_RETRIES}
                </motion.span>
              )}
            </div>
          </motion.div>
          <motion.div layout className="flex items-center gap-2">
            {showControls && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-1 mr-2 bg-muted/50 rounded-lg p-1"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleZoomOut}
                      className="h-8 w-8 rounded-lg hover:bg-background/80"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom out</TooltipContent>
                </Tooltip>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetView}
                  className="h-8 px-2 rounded-lg hover:bg-background/80 text-xs font-medium"
                >
                  {Math.round(zoom * 100)}%
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleZoomIn}
                      className="h-8 w-8 rounded-lg hover:bg-background/80"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom in</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRotate}
                      className="h-8 w-8 rounded-lg hover:bg-background/80"
                    >
                      <RotateCw className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Rotate</TooltipContent>
                </Tooltip>
              </motion.div>
            )}
            {onDownload && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onDownload}
                      className="h-9 w-9 rounded-lg hover:bg-primary/10"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>Download PDF</TooltipContent>
              </Tooltip>
            )}
            {onShare && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onShare}
                    className="h-8 w-8 rounded-full hover:bg-primary/10"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share PDF</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowControls(prev => !prev)}
                  className="h-8 w-8 rounded-full hover:bg-primary/10"
                >
                  {showControls ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showControls ? "Hide controls" : "Show controls"}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="h-8 w-8 rounded-full hover:bg-primary/10"
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              </TooltipContent>
            </Tooltip>
          </motion.div>
        </motion.div>

        <div className="relative flex-1 overflow-hidden bg-muted/20">
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="relative">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 rounded-full border-2 border-primary/30"
                    />
                    <Loader2 className="w-16 h-16 animate-spin text-primary absolute inset-0" />
                  </div>
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm font-medium text-muted-foreground"
                  >
                    {retryCount > 0 ? `Retrying (${retryCount}/${MAX_RETRIES})...` : 'Loading PDF...'}
                  </motion.p>
                </motion.div>
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="flex flex-col items-center gap-4 p-6 max-w-md text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-destructive" />
                  </div>
                  <h3 className="font-semibold">Failed to Load PDF</h3>
                  <p className="text-sm text-muted-foreground">{error}</p>
                  {retryCount < MAX_RETRIES && (
                    <Button
                      variant="outline"
                      onClick={reloadPDF}
                      className="mt-2 gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Try Again
                    </Button>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.iframe
            ref={iframeRef}
            src={`/api/documents/${documentId}/view`}
            className="w-full h-full border-0 bg-white"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            onLoad={() => {
              setIsLoading(false);
              setError(null);
              setRetryCount(0);
            }}
            onError={() => {
              setError("Failed to load PDF. Please try again.");
              setIsLoading(false);
              if (retryCount < MAX_RETRIES) {
                setTimeout(reloadPDF, RETRY_DELAY * Math.pow(2, retryCount));
              }
            }}
          />
        </div>
      </motion.div>
    </TooltipProvider>
  );
} 