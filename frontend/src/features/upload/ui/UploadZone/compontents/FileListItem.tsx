import { FileAudio, CheckCircle, Loader2, Ban, X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";
import { Badge } from "@/shared/ui/badge";
import type { UploadFile } from "@/features/upload/model/upload.types";

interface FileListItemProps {
  file: UploadFile;
  disabled: boolean;
  onRemove: (id: string) => void;
}

const statusIcon = (status: UploadFile["status"]) => {
  switch (status) {
    case "success":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "uploading":
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    case "error":
      return <Ban className="h-4 w-4 text-destructive" />;
    default:
      return <FileAudio className="h-4 w-4 text-muted-foreground" />;
  }
};

const statusBadge = (status: UploadFile["status"]) => {
  switch (status) {
    case "pending":
      return <Badge variant="secondary">Ожидает</Badge>;
    case "uploading":
      return null; // Не показываем, есть прогресс-бар
    case "success":
      return <Badge variant="default">Готово</Badge>;
    case "error":
      return <Badge variant="destructive">Ошибка</Badge>;
  }
};

export const FileListItem = ({ file, disabled, onRemove }: FileListItemProps) => {
  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      {statusIcon(file.status)}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{file.file.name}</p>
        <p className="text-xs text-muted-foreground">
          {(file.file.size / (1024 * 1024)).toFixed(1)} МБ
        </p>
        {file.status === "uploading" && <Progress value={file.progress} className="mt-1 h-1" />}
        {file.status === "error" && file.error && (
          <p className="text-xs text-destructive mt-1">{file.error}</p>
        )}
        {file.status === "success" && file.messageId && (
          <p className="text-xs text-green-600 mt-1">ID: {file.messageId.slice(0, 8)}...</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {file.status === "pending" && (
          <Button variant="ghost" size="icon" onClick={() => onRemove(file.id)} disabled={disabled}>
            <X className="h-4 w-4" />
          </Button>
        )}
        {statusBadge(file.status)}
      </div>
    </div>
  );
};
