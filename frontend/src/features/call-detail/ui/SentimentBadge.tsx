import type { SentimentLabel } from "@/shared/types/api";
import { Badge } from "@/shared/ui/badge";
import { Minus, ThumbsDown, ThumbsUp } from "lucide-react";

const sentimentConfig: Record<
  SentimentLabel,
  { label: string; variant: "default" | "secondary" | "destructive"; icon: typeof ThumbsUp }
> = {
  positive: { label: "Позитив", variant: "default", icon: ThumbsUp },
  neutral: { label: "Нейтрал", variant: "secondary", icon: Minus },
  negative: { label: "Негатив", variant: "destructive", icon: ThumbsDown },
};

export const SentimentBadge = ({
  sentiment,
  score,
}: {
  sentiment: SentimentLabel;
  score: number;
}) => {
  const config = sentimentConfig[sentiment] ?? sentimentConfig.neutral;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label} {(score * 100).toFixed(0)}%
    </Badge>
  );
};
