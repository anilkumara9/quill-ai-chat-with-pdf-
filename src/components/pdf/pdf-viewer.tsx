'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sidebar } from "./sidebar"
import { ChatPanel } from "../chat/chat-panel"
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  MessageCircle, 
  RotateCcw, 
  Search, 
  Settings, 
  ZoomIn, 
  ZoomOut 
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface PDFViewerProps {
  documentId: string;
}

export function PDFViewer({ documentId }: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [showChat, setShowChat] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const loadDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}/view`);
        if (!response.ok) {
          throw new Error('Failed to load document');
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);

        // Load PDF.js if needed
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        if (!pdfjsLib) {
          throw new Error('PDF.js library not found');
        }

        const pdf = await pdfjsLib.getDocument(url).promise;
        setTotalPages(pdf.numPages);
      } catch (error) {
        console.error('Error loading document:', error);
        toast({
          title: "Error",
          description: "Failed to load document. Please try again.",
          variant: "destructive",
        });
      }
    };

    loadDocument();

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [documentId, toast]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar documentId={documentId} />
      
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-2 border-b">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 2}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-1">
              <Input 
                type="number" 
                value={currentPage}
                onChange={(e) => handlePageChange(Number(e.target.value))}
                className="w-16 h-8"
                min={1}
                max={totalPages}
              />
              <span className="text-sm text-muted-foreground">/ {totalPages}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Search className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowChat(!showChat)}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 flex">
          <div className="flex-1 bg-muted/10 flex items-center justify-center overflow-auto">
            {pdfUrl ? (
              <div 
                className="bg-white shadow-lg relative"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease-in-out'
                }}
              >
                <iframe
                  src={`${pdfUrl}#page=${currentPage}`}
                  className="w-[800px] h-[1000px]"
                  title="PDF Viewer"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center text-muted-foreground">
                Loading PDF...
              </div>
            )}
          </div>
          
          {showChat && <ChatPanel documentId={documentId} />}
        </div>
      </div>
    </div>
  )
} 