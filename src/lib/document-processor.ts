import { prisma } from "@/lib/db";
import { Document } from "@prisma/client";

export interface ProcessingResult {
  success: boolean;
  error?: string;
  content?: string;
  metadata?: {
    pageCount?: number;
    title?: string;
    author?: string;
    keywords?: string[];
    fileType?: string;
    fileSize?: number;
    processingTime?: number;
  };
}

export class DocumentProcessor {
  private static instance: DocumentProcessor;
  private processingQueue: Map<string, boolean>;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  private constructor() {
    this.processingQueue = new Map();
  }

  public static getInstance(): DocumentProcessor {
    if (!DocumentProcessor.instance) {
      DocumentProcessor.instance = new DocumentProcessor();
    }
    return DocumentProcessor.instance;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async updateDocumentStatus(
    documentId: string,
    status: string,
    error?: string
  ): Promise<void> {
    try {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status,
          ...(error && {
            activities: {
              create: {
                action: "ERROR",
                userId: (await prisma.document.findUnique({
                  where: { id: documentId },
                  select: { userId: true }
                }))?.userId || "",
                details: { error }
              }
            }
          })
        }
      });
    } catch (err) {
      console.error("Failed to update document status:", err);
    }
  }

  private async processFileContent(url: string, fileType: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`);
    }

    switch (fileType) {
      case 'text/plain':
      case 'text/markdown':
        return response.text();
      
      case 'application/pdf':
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        // For now, just store the URL for these types
        // We'll implement proper processing later
        return url;
      
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  public async processDocument(documentId: string): Promise<ProcessingResult> {
    const startTime = Date.now();

    if (this.processingQueue.get(documentId)) {
      return { success: false, error: "Document is already being processed" };
    }

    this.processingQueue.set(documentId, true);
    let retries = 0;

    try {
      while (retries < this.maxRetries) {
        try {
          await this.updateDocumentStatus(documentId, "processing");

          const document = await prisma.document.findUnique({
            where: { id: documentId }
          });

          if (!document?.content) {
            throw new Error("Document content URL not found");
          }

          // Process the content based on file type
          const processedContent = await this.processFileContent(
            document.content,
            document.fileType
          );

          // Create a new version with the processed content
          await prisma.version.create({
            data: {
              documentId,
              content: processedContent,
              changes: "Initial processing",
            }
          });

          // Log the processing activity
          await prisma.documentActivity.create({
            data: {
              documentId,
              userId: document.userId,
              action: "PROCESSED",
              details: {
                fileType: document.fileType,
                fileSize: document.fileSize,
                processingTime: Date.now() - startTime,
              }
            }
          });

          // Update document status
          await prisma.document.update({
            where: { id: documentId },
            data: { status: "completed" }
          });

          this.processingQueue.delete(documentId);
          
          return {
            success: true,
            content: processedContent,
            metadata: {
              fileType: document.fileType,
              fileSize: document.fileSize,
              title: document.title,
              processingTime: Date.now() - startTime
            }
          };
        } catch (error) {
          retries++;
          if (retries === this.maxRetries) {
            throw error;
          }
          await this.delay(this.retryDelay * Math.pow(2, retries));
        }
      }

      throw new Error("Maximum retries exceeded");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      await this.updateDocumentStatus(documentId, "error", errorMessage);
      this.processingQueue.delete(documentId);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  public async getProcessingStatus(documentId: string): Promise<{
    status: string;
    error?: string;
    progress?: number;
  }> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        activities: {
          where: {
            OR: [
              { action: "ERROR" },
              { action: "PROCESSED" }
            ]
          },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    if (!document) {
      return { status: "error", error: "Document not found" };
    }

    // Calculate progress based on status
    let progress = 0;
    switch (document.status) {
      case "pending":
        progress = 0;
        break;
      case "processing":
        progress = 50;
        break;
      case "completed":
        progress = 100;
        break;
      case "error":
        progress = 0;
        break;
    }

    return {
      status: document.status,
      error: document.activities[0]?.details?.error,
      progress
    };
  }
} 