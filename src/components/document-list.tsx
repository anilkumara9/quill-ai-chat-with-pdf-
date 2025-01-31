"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  File,
  FileText,
  MessageSquare,
  MoreVertical,
  Share2,
  Trash2,
  Loader2,
  FileIcon,
  FileImage,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

interface Document {
  id: string;
  title: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  status: string;
  url?: string;
  category?: {
    id: string;
    name: string;
    color?: string;
  };
}

const FileTypeIcon = {
  "text/plain": FileText,
  "application/pdf": FileText,
  "image/png": FileImage,
  "image/jpeg": FileImage,
  "image/jpg": FileImage,
  default: File,
} as const;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    }
  },
};

function LoadingCard() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/5 animate-pulse" />
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-primary/5 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-primary/5 rounded animate-pulse w-1/2" />
              <div className="flex gap-2">
                <div className="h-5 bg-primary/5 rounded-full animate-pulse w-20" />
                <div className="h-5 bg-primary/5 rounded-full animate-pulse w-24" />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
      </Card>
    </motion.div>
  );
}

export function DocumentList() {
  const router = useRouter();
  const { toast } = useToast();
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [documentToDelete, setDocumentToDelete] = React.useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/documents");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch documents");
      }
      const data = await response.json();
      setDocuments(data.documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setError(error instanceof Error ? error.message : "Failed to load documents");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (document: Document) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/documents/${documentToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete document");
      }

      setDocuments(docs => docs.filter(d => d.id !== documentToDelete.id));
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleShare = async (document: Document) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/documents/${document.id}`
      );
      toast({
        title: "Link copied",
        description: "Document link has been copied to clipboard",
      });
    } catch (error) {
      console.error("Error copying link:", error);
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    return FileTypeIcon[fileType as keyof typeof FileTypeIcon] || FileTypeIcon.default;
  };

  if (loading) {
    return (
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {[...Array(6)].map((_, i) => (
          <motion.div key={i} variants={item}>
            <LoadingCard />
          </motion.div>
        ))}
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[300px] text-center"
      >
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <FileIcon className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Unable to load documents</h3>
        <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
        <Button
          variant="outline"
          size="lg"
          onClick={fetchDocuments}
          className="gap-2"
        >
          <motion.div
            animate={{ rotate: loading ? 360 : 0 }}
            transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: "linear" }}
          >
            <Loader2 className="w-4 h-4" />
          </motion.div>
          Try again
        </Button>
      </motion.div>
    );
  }

  if (documents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="flex flex-col items-center justify-center min-h-[300px] text-center p-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"
        >
          <FileIcon className="w-8 h-8 text-primary" />
        </motion.div>
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-semibold mb-2"
        >
          No documents yet
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground mb-6 max-w-md"
        >
          Get started by uploading your first document. You can upload PDFs, images, and text files.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={() => router.push("/documents/upload")}
            size="lg"
            className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-primary/20 transition-all duration-300"
          >
            Upload your first document
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {documents.map((doc) => {
            const IconComponent = getFileIcon(doc.fileType);
            return (
              <motion.div
                key={doc.id}
                variants={item}
                layout
                layoutId={doc.id}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Card
                  className={cn(
                    "group relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-br from-card to-card/95",
                    doc.status === "processing" && "opacity-70"
                  )}
                  onClick={() => router.push(`/documents/${doc.id}/chat`)}
                >
                  <motion.div 
                    className="p-6"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <div className="flex items-start gap-4">
                      <motion.div 
                        className={cn(
                          "p-3 rounded-lg",
                          doc.status === "processing" ? "bg-muted" : "bg-primary/10"
                        )}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        {doc.status === "processing" ? (
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        ) : (
                          <IconComponent className="w-6 h-6 text-primary" />
                        )}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold truncate text-base">{doc.title}</h3>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/documents/${doc.id}/chat`);
                                }}
                                className="gap-2"
                                disabled={doc.status === "processing"}
                              >
                                <MessageSquare className="w-4 h-4" />
                                Chat with document
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShare(doc);
                                }}
                                className="gap-2"
                              >
                                <Share2 className="w-4 h-4" />
                                Share document
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(doc);
                                }}
                                className="gap-2 text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete document
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {doc.category && (
                            <Badge
                              variant="modern"
                              className="bg-primary/10 text-primary hover:bg-primary/20"
                            >
                              {doc.category.name}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(doc.createdAt), "MMM d, yyyy")}
                          </span>
                          {doc.status === "processing" && (
                            <Badge variant="outline" className="bg-muted/50">
                              Processing
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document
              and all associated chat history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
