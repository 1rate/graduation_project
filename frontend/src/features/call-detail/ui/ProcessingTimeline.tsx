import type { MessageStatus } from "@/shared/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { CheckCircle, Circle, Clock } from "lucide-react";

const stages: Array<{ key: MessageStatus; label: string }> = [
  { key: "pending", label: "Принято" },
  { key: "transcribed", label: "Распознано (STT)" },
  { key: "pending", label: "Тональность определена" },
  { key: "pending", label: "Категория определена" },
  { key: "enriched", label: "Обработано (Indexer)" },
];

// Упрощённая версия: статус enriched = все этапы пройдены
const completedStages: Record<MessageStatus, number> = {
  pending: 0,
  transcribed: 1,
  enriched: 5,
  failed: 0,
};

export const ProcessingTimeline = ({ status }: { status: MessageStatus }) => {
  const completed = completedStages[status] ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          Ход обработки
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const isCompleted = index < completed;
            const isCurrent = index === completed && status !== "failed";
            return (
              <div key={index} className="flex items-center gap-3">
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                ) : isCurrent ? (
                  <Clock className="h-4 w-4 text-primary animate-pulse shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span
                  className={`text-sm ${isCompleted || isCurrent ? "" : "text-muted-foreground"}`}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
