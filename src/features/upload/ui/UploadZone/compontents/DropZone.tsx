import { useCallback, useState, useRef, type DragEvent } from "react";
import { Upload, FolderOpen } from "lucide-react";
import { Button } from "@/shared/ui/button";

interface DropZoneProps {
  disabled: boolean;
  onFilesSelected: (files: FileList) => void;
}

export const DropZone = ({ disabled, onFilesSelected }: DropZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragOut = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        onFilesSelected(e.dataTransfer.files);
      }
    },
    [onFilesSelected],
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFilesSelected(e.target.files);
        e.target.value = "";
      }
    },
    [onFilesSelected],
  );

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
        isDragOver
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50"
      }`}
    >
      <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
      <p className="text-sm text-muted-foreground mb-1">Перетащите файлы сюда</p>
      <p className="text-xs text-muted-foreground mb-4">MP3, WAV, OGG до 50 МБ каждый</p>
      <div className="flex items-center justify-center gap-3">
        <label>
          <Button variant="outline" disabled={disabled} asChild>
            <span>
              <Upload className="mr-2 h-4 w-4" />
              Файлы
            </span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/mpeg,audio/wav,audio/ogg"
            onChange={handleInput}
            className="hidden"
          />
        </label>
        <label>
          <Button variant="outline" disabled={disabled} asChild>
            <span>
              <FolderOpen className="mr-2 h-4 w-4" />
              Папку
            </span>
          </Button>
          <input
            ref={folderInputRef}
            type="file"
            // @ts-expect-error webkitdirectory
            webkitdirectory=""
            multiple
            accept="audio/mpeg,audio/wav,audio/ogg"
            onChange={handleInput}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
};
