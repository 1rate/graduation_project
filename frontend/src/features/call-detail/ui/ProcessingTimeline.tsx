import type { MessageStatus } from "@/shared/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { CheckCircle, Circle, Clock, XCircle } from "lucide-react";

const stages: Array<{ key: MessageStatus; label: string }> = [
  { key: "pending", label: "Принято" },
  { key: "pending", label: "Ожидает обработки" },
  { key: "transcribed", label: "Речь распознана" },
  { key: "transcribed", label: "Тональность определена" },
  { key: "transcribed", label: "Категория определена" },
  { key: "transcribed", label: "Обработано" },
];
const stageOrder: Array<MessageStatus | "received" | "sentiment" | "category"> = [
  "received",
  "pending",
  "transcribed",
  "sentiment",
  "category",
  "enriched",
];

const completedStages: Record<MessageStatus, number> = {
  pending: 1,
  transcribed: 6,
  failed: -1,
};

export const ProcessingTimeline = ({ status }: { status: MessageStatus }) => {
  const completed = completedStages[status] ?? 0;
  const isFailed = status === "failed";
  console.log(status);
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
          {stages.map((stage) => {
            const stagePosition = stageOrder.indexOf(stage.key);
            const isCompleted = stagePosition >= 0 && stagePosition < completed;
            const isCurrent = stagePosition === completed && !isFailed;

            return (
              <div key={stage.key} className="flex items-center gap-3">
                {isFailed ? (
                  <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                ) : isCompleted ? (
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                ) : isCurrent ? (
                  <Clock className="h-4 w-4 text-primary animate-pulse shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    isFailed
                      ? "text-red-500"
                      : isCompleted || isCurrent
                        ? ""
                        : "text-muted-foreground"
                  }`}
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
