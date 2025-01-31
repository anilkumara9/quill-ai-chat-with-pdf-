"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  File as FileIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  X,
  FileEdit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { DocumentUploadResponse, APIResponse, APIErrorResponse } from "@/types";

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadResponse {
  id: string;
  title: string;
  status: string;
}

interface UploadError {
  error: string;
  details?: string;
}

// Type guard for File objects
function isFile(value: any): value is File {
  return value instanceof File;
}

export function DocumentUpload() {
  const router = useRouter();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [fileToRename, setFileToRename] = useState<File | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  const [storageError, setStorageError] = useState(false);

  // Add user sync function
  const syncUser = useCallback(async () => {
    try {
      console.log('[User Sync] Starting user sync');
      const response = await fetch('/api/sync-user');
      
      if (!response.ok) {
        const error = await response.json();
        console.error('[User Sync] Failed:', error);
        throw new Error(error.details || error.error || 'Failed to sync user data');
      }
      
      const data = await response.json();
      console.log('[User Sync] Success:', data);
      return data.success;
    } catch (error) {
      console.error('[User Sync Error]:', error);
      return false;
    }
  }, []);

  const simulateProgress = useCallback(() => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + 5;
      });
    }, 500);
    progressIntervalRef.current = interval;
    return interval;
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    if (!file || !(file instanceof File)) {
      return "Invalid file object";
    }

    if (!file.type || !ALLOWED_FILE_TYPES.includes(file.type)) {
      return "Invalid file type. Only PDF, text, and Word documents are allowed";
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`;
    }

    return null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (!isFile(droppedFile)) {
      toast({
        title: "Invalid File",
        description: "Please provide a valid file",
        variant: "destructive",
      });
      return;
    }

    const error = validateFile(droppedFile);
    if (error) {
      toast({
        title: "Invalid File",
        description: error,
        variant: "destructive",
      });
      return;
    }

    setFile(droppedFile);
  }, [toast]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const error = validateFile(selectedFile);
    if (error) {
      toast({
        title: "Invalid File",
        description: error,
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
  }, [toast]);

  const handleRename = useCallback(() => {
    if (!fileToRename || !newFileName) return;
    
    try {
      // Create a new blob from the original file
      const blob = new Blob([fileToRename], { type: "application/pdf" });
      
      // Create a new file object
      const renamedFile = new File([blob], `${newFileName.trim()}.pdf`, {
        type: "application/pdf",
        lastModified: Date.now(),
      });
      
      if (!isFile(renamedFile)) {
        throw new Error("Failed to create new file");
      }
      
      setFile(renamedFile);
      setFileToRename(null);
      setNewFileName("");
      setShowRenameDialog(false);
      
      // Start upload with renamed file
      handleUploadFile(renamedFile);
    } catch (error) {
      console.error("Error renaming file:", error);
      toast({
        title: "Error",
        description: "Failed to rename file. Please try again.",
        variant: "destructive",
      });
    }
  }, [fileToRename, newFileName, toast]);

  const handleUploadFile = useCallback(async (fileToUpload: File) => {
    if (!fileToUpload) return;

    try {
      setUploading(true);
      setStorageError(false);

      // Sync user before upload
      console.log('[Upload] Syncing user before upload');
      const synced = await syncUser();
      if (!synced) {
        throw new Error("Failed to sync user data. Please try again.");
      }

      const progressInterval = simulateProgress();

      // Validate file before upload
      const validationError = validateFile(fileToUpload);
      if (validationError) {
        throw new Error(validationError);
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("title", fileToUpload.name);

      console.log('[Upload] Starting upload for:', {
        fileName: fileToUpload.name,
        fileType: fileToUpload.type,
        fileSize: fileToUpload.size
      });

      const maxRetries = 3;
      let retryCount = 0;
      let uploaded = false;

      while (retryCount < maxRetries && !uploaded) {
        try {
          const response = await fetch("/api/documents/upload", {
            method: "POST",
            body: formData,
          });

          console.log('[Upload] Response status:', response.status);

          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Invalid response format: expected JSON");
          }

          const data = await response.json();
          console.log('[Upload] Response data:', data);

          if (!response.ok) {
            switch (data.code) {
              case "AUTH_REQUIRED":
                throw new Error("Please sign in to upload documents");
              case "USER_SYNC_ERROR":
                throw new Error("Failed to sync user data. Please try again.");
              case "USER_NOT_FOUND":
                // Try to sync user again
                console.log('[Upload] User not found, attempting resync');
                const resynced = await syncUser();
                if (!resynced) {
                  throw new Error("Failed to create user account. Please try again.");
                }
                throw new Error("Please try uploading again.");
              case "INVALID_FILE":
                throw new Error(data.details || "Please provide a valid file");
              case "FILE_VALIDATION_ERROR":
                throw new Error(Array.isArray(data.details) ? data.details.join(", ") : data.error);
              case "VALIDATION_ERROR":
                throw new Error(data.details || "Invalid document data");
              case "DUPLICATE_TITLE":
                setFileToRename(fileToUpload);
                setNewFileName(fileToUpload.name.replace(/\.[^/.]+$/, ""));
                setShowRenameDialog(true);
                return;
              case "STORAGE_ERROR":
                setStorageError(true);
                throw new Error("Storage service unavailable. Please try again later.");
              case "DB_ERROR":
                throw new Error("Failed to save document. Please try again.");
              default:
                throw new Error(data.error || "Upload failed. Please try again.");
            }
          }

          if (!data.success || !data.document?.id) {
            throw new Error("Invalid response format: missing document data");
          }

          uploaded = true;
          setUploadProgress(100);
          clearInterval(progressInterval);

          toast({
            title: "Success",
            description: "Document uploaded successfully",
            variant: "default",
          });

          router.push(`/documents/${data.document.id}`);
          router.refresh();

        } catch (error) {
          console.error('[Upload] Error:', error);
          retryCount++;

          if (retryCount === maxRetries) {
            throw error;
          }

          const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000);
          console.log(`[Upload] Retrying in ${backoffTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    } catch (error) {
      console.error('[Upload] Final error:', error);
      clearInterval(progressIntervalRef.current);
      setUploadProgress(0);
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setFile(null);
    }
  }, [router, simulateProgress, toast, validateFile, syncUser]);

  const handleUploadClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (file) {
      handleUploadFile(file);
    }
  }, [file, handleUploadFile]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return (
    <>
      <div className="max-w-xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 transition-all duration-300",
              dragOver
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
              uploading && "opacity-50 pointer-events-none"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{
                  scale: dragOver ? 1.1 : 1,
                  rotate: dragOver ? 10 : 0,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="p-4 bg-primary/10 rounded-full"
              >
                <FileIcon className="h-10 w-10 text-primary" />
              </motion.div>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">
                  {dragOver ? "Drop your PDF here" : "Upload your document"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Drag and drop your PDF file here, or click to browse. 
                  Maximum file size: 10MB
                </p>
              </div>

              <Input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
                id="file-input"
              />
              
              {file ? (
                <Button
                  onClick={handleUploadClick}
                  disabled={uploading}
                  className="w-full relative group"
                  size="lg"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Document
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="relative overflow-hidden group"
                  disabled={uploading}
                >
                  <label htmlFor="file-input" className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2 transition-transform group-hover:-translate-y-1" />
                    Choose File
                  </label>
                </Button>
              )}
            </div>
          </div>

          {/* Selected File Info */}
          <AnimatePresence>
            {file && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-4 p-4 rounded-lg bg-muted/50 border"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                    disabled={uploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {uploading && (
                  <Progress 
                    value={uploadProgress} 
                    className="mt-2"
                    variant="modern"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
            <DialogDescription>
              A document with this name already exists. Please choose a different name.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <FileEdit className="w-4 h-4 text-muted-foreground" />
              <Input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="Enter new filename"
                className="col-span-3"
                autoFocus
              />
              <span className="text-muted-foreground">.pdf</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRenameDialog(false);
                setUploading(false);
                setFile(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={!newFileName.trim() || newFileName === fileToRename?.name}
            >
              Upload with New Name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {storageError && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-destructive/10 rounded-lg text-center"
        >
          <p className="text-sm text-destructive font-medium mb-2">
            Storage Service Unavailable
          </p>
          <p className="text-sm text-muted-foreground">
            We're experiencing issues with our storage service. Please try again later.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => setStorageError(false)}
          >
            Dismiss
          </Button>
        </motion.div>
      )}
    </>
  );
}
