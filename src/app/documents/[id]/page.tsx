"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowLeft, Download, Trash, Share2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentActions } from "@/components/document-actions";
import { motion } from "framer-motion";

interface Document {
  id: string;
  title: string;
  content: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  url?: string;
}

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchDocument();
    }
    // Cleanup PDF URL on unmount
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [params.id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/documents/${params.id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch document");
      }

      const data = await response.json();
      setDocument(data);
      
      // Create PDF URL if it's a PDF file
      if (data.fileType === 'application/pdf') {
        const pdfResponse = await fetch(`/api/documents/${params.id}/content`);
        if (!pdfResponse.ok) {
          throw new Error("Failed to fetch PDF content");
        }
        const pdfBlob = await pdfResponse.blob();
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
      }
    } catch (error) {
      console.error("Error fetching document:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch document");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchDocument();
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-screen p-4"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20" />
          <Loader2 className="w-16 h-16 animate-spin text-primary absolute inset-0" />
        </div>
        <p className="text-muted-foreground mt-4">Loading document...</p>
      </motion.div>
    );
  }

  if (error || !document) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-screen p-4"
      >
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Document Not Found</h1>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          {error || "The document you're looking for doesn't exist or you don't have permission to view it."}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/documents")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Documents
          </Button>
          <Button onClick={handleRetry}>
            <Loader2 className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => router.push("/documents")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-xl font-semibold">{document.title}</h1>
          </div>
          <DocumentActions
            documentId={document.id}
            documentTitle={document.title}
            onDelete={() => router.push("/documents")}
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-lg shadow-sm border p-6"
        >
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
            <p className="flex items-center">
              Type: <span className="ml-1 text-foreground">{document.fileType}</span>
            </p>
            <div className="h-4 w-px bg-border" />
            <p className="flex items-center">
              Size: <span className="ml-1 text-foreground">{(document.fileSize / 1024).toFixed(2)} KB</span>
            </p>
            <div className="h-4 w-px bg-border" />
            <p className="flex items-center">
              Created: <span className="ml-1 text-foreground">{new Date(document.createdAt).toLocaleDateString()}</span>
            </p>
          </div>
          
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {document.fileType === 'application/pdf' && pdfUrl ? (
              <div className="relative rounded-lg overflow-hidden border bg-background">
                <iframe
                  src={pdfUrl}
                  className="w-full h-[800px] border-0"
                  title={document.title}
                />
              </div>
            ) : (
              <pre className="bg-muted p-4 rounded-lg overflow-auto whitespace-pre-wrap">
                {document.content}
              </pre>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
