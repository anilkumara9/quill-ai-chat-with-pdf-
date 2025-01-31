export interface Document {
  id: string;
  title: string;
  content: string;
  fileType: string;
  fileSize: number;
  userId: string;
  categoryId?: string | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
  url?: string | null;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentWithCategory extends Document {
  category?: Category | null;
}

export interface DocumentListItem {
  id: string;
  title: string;
  fileType: string;
  createdAt: Date;
  uploadedAt: Date;
}

export interface DocumentUploadResponse {
  id: string;
  title: string;
  fileType: string;
  createdAt: Date;
  uploadedAt: Date;
}

export interface APIErrorResponse {
  error: string;
  details?: string;
}

export type APIResponse<T> = T | APIErrorResponse; 