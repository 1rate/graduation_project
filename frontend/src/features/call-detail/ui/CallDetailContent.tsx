import { useCallDetail } from "@/features/call-detail/model/useCallDetail";
import { AnalysisDetails } from "@/features/call-detail/ui/AnalysisDetails";
import { AudioPlayer } from "@/features/call-detail/ui/AudioPlayer";
import { CategoryBadge } from "@/features/call-detail/ui/CategoryBadge";
import { ProcessingTimeline } from "@/features/call-detail/ui/ProcessingTimeline";
import { SentimentBadge } from "@/features/call-detail/ui/SentimentBadge";
import { StatusBadge } from "@/features/call-detail/ui/StatusBadge";
import { TranscriptBox } from "@/features/call-detail/ui/TranscriptBox";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Skeleton } from "@/shared/ui/skeleton";
import { AlertCircle, Calendar, MessageSquare } from "lucide-react";

interface CallDetailContentProps {
  id: string;
  compact?: boolean;
}

export const CallDetailContent = ({ id, compact = false }: CallDetailContentProps) => {
  const { data, isLoading, isError } = useCallDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Обращение не найдено</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      {/* Заголовок — только в полной версии */}
      {!compact && (
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Обращение #{data.id.slice(0, 8)}</h2>
          <StatusBadge status={data.status} />
        </div>
      )}

      {/* Карточки статуса/тональности/категории */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {compact && (
          <div className="col-span-2 lg:col-span-3 flex items-center gap-2">
            <StatusBadge status={data.status} />
          </div>
        )}
        {data.sentiment && (
          <SentimentBadge sentiment={data.sentiment.label} score={data.sentiment.score} />
        )}
        {data.category && (
          <CategoryBadge category={data.category.category} score={data.category.score} />
        )}
      </div>

      {/* Мета-строка */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {new Date(data.received_at).toLocaleString("ru-RU")}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-4 w-4" />
          {data.source === "audio" ? "Аудио" : "Текст"}
        </span>
      </div>

      {/* Аудиоплеер (если есть) */}
      {data.audio_url && <AudioPlayer url={data.audio_url} />}

      {/* Текст обращения */}
      <TranscriptBox text={data.text} />

      {/* Детали анализа — только в полной версии */}
      {!compact && data.sentiment && data.category && (
        <AnalysisDetails
          sentimentLabel={data.sentiment.label}
          sentimentScore={data.sentiment.score}
          sentimentModel={data.sentiment.model_version}
          category={data.category.category}
          categoryScore={data.category.score}
          categoryModel={data.category.model_version}
        />
      )}

      {/* Таймлайн — только в полной версии */}
      {!compact && <ProcessingTimeline status={data.status} />}
    </div>
  );
};
