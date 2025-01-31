"use client"

import React, { useState } from "react"
import { Button } from "./ui/button"
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Download,
  Share2
} from "lucide-react"
import { useToast } from "./ui/use-toast"

interface DocumentViewerProps {
  url: string
  title: string
  fileType: string
  onShare?: () => void
}

export function DocumentViewer({ url, title, fileType, onShare }: DocumentViewerProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const { toast } = useToast()

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2))
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)

  const handleDownload = async () => {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to download file')
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = title
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Error downloading document:', error)
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      })
    }
  }

  const renderContent = () => {
    if (fileType.includes('pdf')) {
      return (
        <iframe
          src={`${url}#toolbar=0&page=${currentPage}`}
          className="w-full h-full border-0"
          title={title}
        />
      )
    }
    
    if (fileType.includes('image')) {
      return (
        <img
          src={url}
          alt={title}
          className="max-w-full max-h-full object-contain"
        />
      )
    }

    // For text-based documents
    return (
      <div className="p-4 bg-white rounded-lg shadow overflow-auto">
        <pre className="whitespace-pre-wrap font-mono text-sm">
          {url}
        </pre>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || !fileType.includes('pdf')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {fileType.includes('pdf') && (
            <span className="text-sm">Page {currentPage}</span>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={!fileType.includes('pdf')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRotate}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
          {onShare && (
            <Button
              variant="outline"
              size="icon"
              onClick={onShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Document Display */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s ease-in-out'
          }}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
