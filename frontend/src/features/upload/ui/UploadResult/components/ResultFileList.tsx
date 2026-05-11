import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";

interface ResultFile {
  messageId: string;
  fileName: string;
}

interface ResultFileListProps {
  items: ResultFile[];
}

export const ResultFileList = ({ items }: ResultFileListProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCopy = async (id: string) => {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <ScrollArea className="h-[200px] rounded-md border">
      <div className="p-3 space-y-2">
        {items.map((item) => (
          <div
            key={item.messageId}
            className="flex items-center justify-between rounded-md bg-muted/50 p-2"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate">{item.fileName}</p>
              <code className="text-xs text-muted-foreground">
                {item.messageId.slice(0, 16)}...
              </code>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => handleCopy(item.messageId)}>
                {copiedId === item.messageId ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/calls/${item.messageId}`)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
