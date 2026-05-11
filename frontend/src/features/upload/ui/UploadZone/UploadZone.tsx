import { SourceSwitch } from "@/features/upload/ui/UploadZone/compontents/SourceSwitch";
import { TextInput } from "@/features/upload/ui/UploadZone/compontents/TextInput";
import { DropZone } from "@/features/upload/ui/UploadZone/compontents/DropZone";
import { FileList } from "@/features/upload/ui/UploadZone/compontents/FileList";
import { UploadActions } from "@/features/upload/ui/UploadZone/compontents/UploadActions";
import type { UploadSource, UploadFile } from "@/features/upload/model/upload.types";

interface UploadZoneProps {
  source: UploadSource;
  text: string;
  files: UploadFile[];
  isUploading: boolean;
  pendingCount: number;
  onSourceChange: (source: UploadSource) => void;
  onTextChange: (text: string) => void;
  onFilesAdd: (files: FileList) => void;
  onFileRemove: (id: string) => void;
  onUpload: () => void;
  onCancel: () => void;
  canUpload: boolean;
}

export const UploadZone = ({
  source,
  text,
  files,
  isUploading,
  pendingCount,
  onSourceChange,
  onTextChange,
  onFilesAdd,
  onFileRemove,
  onUpload,
  onCancel,
  canUpload,
}: UploadZoneProps) => {
  return (
    <div className="space-y-6">
      <SourceSwitch source={source} disabled={isUploading} onChange={onSourceChange} />

      {source === "text" && (
        <TextInput value={text} disabled={isUploading} onChange={onTextChange} />
      )}

      {source === "audio" && (
        <>
          <DropZone disabled={isUploading} onFilesSelected={onFilesAdd} />
          {files.length > 0 && (
            <FileList files={files} disabled={isUploading} onRemove={onFileRemove} />
          )}
        </>
      )}

      <UploadActions
        canUpload={canUpload}
        isUploading={isUploading}
        pendingCount={pendingCount}
        onUpload={onUpload}
        onCancel={onCancel}
      />
    </div>
  );
};
