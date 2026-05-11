import { FileAudio, FileText } from "lucide-react";
import { Button } from "@/shared/ui/button";
import type { UploadSource } from "@/features/upload/model/upload.types";

interface SourceSwitchProps {
  source: UploadSource;
  disabled: boolean;
  onChange: (source: UploadSource) => void;
}

export const SourceSwitch = ({ source, disabled, onChange }: SourceSwitchProps) => {
  return (
    <div className="flex gap-2">
      <Button
        variant={source === "text" ? "default" : "outline"}
        onClick={() => onChange("text")}
        disabled={disabled}
      >
        <FileText className="mr-2 h-4 w-4" />
        Текст
      </Button>
      <Button
        variant={source === "audio" ? "default" : "outline"}
        onClick={() => onChange("audio")}
        disabled={disabled}
      >
        <FileAudio className="mr-2 h-4 w-4" />
        Аудио
      </Button>
    </div>
  );
};
