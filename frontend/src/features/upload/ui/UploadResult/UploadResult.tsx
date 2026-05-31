import type { UploadResult as UploadResultType } from "@/features/upload/model/upload.types";
import { ResultFileList } from "@/features/upload/ui/UploadResult/components/ResultFileList";
import { ResultSummary } from "@/features/upload/ui/UploadResult/components/ResultSummary";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UploadResultProps {
  result: UploadResultType;
  onReset: () => void;
}

export const UploadResult = ({ result, onReset }: UploadResultProps) => {
  const navigate = useNavigate();

  return (
    <Card className={result.failed > 0 ? "border-yellow-500" : "border-green-500"}>
      <CardContent className="p-6 space-y-4">
        <ResultSummary success={result.success} failed={result.failed} />

        {result.items.length > 0 && <ResultFileList items={result.items} />}

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onReset}>
            Загрузить ещё
          </Button>
          {result.items.length === 1 && result.items[0] && (
            <Button
              onClick={() => {
                const id = result.items[0]?.messageId;
                if (id) navigate(`/history/${id}`);
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Открыть обращение
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
