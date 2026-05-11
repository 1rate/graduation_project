import { ScrollArea } from "@/shared/ui/scroll-area";
import { FileListItem } from "@/features/upload/ui/UploadZone/compontents/FileListItem";
import type { UploadFile } from "@/features/upload/model/upload.types";

interface FileListProps {
  files: UploadFile[];
  disabled: boolean;
  onRemove: (id: string) => void;
}

export const FileList = ({ files, disabled, onRemove }: FileListProps) => {
  return (
    <ScrollArea className="h-[300px] rounded-md border">
      <div className="p-3 space-y-2">
        {files.map((file) => (
          <FileListItem key={file.id} file={file} disabled={disabled} onRemove={onRemove} />
        ))}
      </div>
    </ScrollArea>
  );
};
