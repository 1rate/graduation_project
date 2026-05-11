import { Upload } from "lucide-react";
import { Button } from "@/shared/ui/button";

interface UploadActionsProps {
  canUpload: boolean;
  isUploading: boolean;
  pendingCount: number;
  onUpload: () => void;
  onCancel: () => void;
}

export const UploadActions = ({
  canUpload,
  isUploading,
  pendingCount,
  onUpload,
  onCancel,
}: UploadActionsProps) => {
  return (
    <div className="flex gap-3">
      <Button onClick={onUpload} disabled={!canUpload} className="flex-1" size="lg">
        <Upload className="mr-2 h-4 w-4" />
        {isUploading
          ? `Загрузка ${pendingCount} файлов...`
          : `Загрузить ${pendingCount > 0 ? `(${pendingCount})` : ""}`}
      </Button>
      {isUploading && (
        <Button variant="outline" onClick={onCancel} size="lg">
          Отмена
        </Button>
      )}
    </div>
  );
};
