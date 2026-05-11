export type UploadSource = "text" | "audio";

export interface UploadFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  messageId?: string;
  error?: string;
}

export interface UploadState {
  source: UploadSource;
  text: string;
  files: UploadFile[];
  isUploading: boolean;
  completedCount: number;
  errorCount: number;
}

export interface UploadResult {
  total: number;
  success: number;
  failed: number;
  items: Array<{ messageId: string; fileName: string }>;
}
