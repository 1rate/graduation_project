import type { SentimentLabel } from "@/shared/types/api";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { RotateCcw } from "lucide-react";

interface SearchFiltersProps {
  from: string;
  to: string;
  sentiment: SentimentLabel | "";
  onFromChange: (from: string) => void;
  onToChange: (to: string) => void;
  onSentimentChange: (sentiment: SentimentLabel | "") => void;
  onReset: () => void;
}

const sentimentOptions: Array<{
  value: SentimentLabel;
  label: string;
  variant: "default" | "secondary" | "destructive";
}> = [
  { value: "positive", label: "Позитив", variant: "default" },
  { value: "neutral", label: "Нейтрал", variant: "secondary" },
  { value: "negative", label: "Негатив", variant: "destructive" },
];

const hasFilters = (from: string, to: string, sentiment: string) => from || to || sentiment;

export const SearchFilters = ({
  from,
  to,
  sentiment,
  onFromChange,
  onToChange,
  onSentimentChange,
  onReset,
}: SearchFiltersProps) => {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">С</label>
        <Input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="w-40"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">По</label>
        <Input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="w-40"
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        {sentimentOptions.map((opt) => (
          <Badge
            key={opt.value}
            variant={sentiment === opt.value ? opt.variant : "outline"}
            className="cursor-pointer select-none"
            onClick={() => onSentimentChange(sentiment === opt.value ? "" : opt.value)}
          >
            {opt.label}
          </Badge>
        ))}
      </div>
      {hasFilters(from, to, sentiment) && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Сбросить
        </Button>
      )}
    </div>
  );
};
