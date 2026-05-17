import { DatePickerClearable } from "@/shared/components/DatePicker";
import type { SentimentLabel } from "@/shared/types/api";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { RotateCcw } from "lucide-react";

interface SearchFiltersProps {
  from: string;
  to: string;
  sentiment: SentimentLabel | "";
  q: string | "";
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

const hasFilters = (from: string, to: string, sentiment: string, q: string) =>
  from || to || sentiment || q;

export const SearchFilters = ({
  from,
  to,
  sentiment,
  q,
  onFromChange,
  onToChange,
  onSentimentChange,
  onReset,
}: SearchFiltersProps) => {
  return (
    <div className="flex flex-wrap items-end gap-3 w-full h-full">
      <div className="flex items-end gap-2">
        <DatePickerClearable value={from} onChange={onFromChange} placeholder="MM.ДД.ГГГГ" />
        <span className="text-lg text-muted-foreground pb-1">—</span>
        <DatePickerClearable value={to} onChange={onToChange} placeholder="MM.ДД.ГГГГ" />
      </div>

      <div className="flex gap-2 flex-wrap items-center h-full">
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

      {hasFilters(from, to, sentiment, q) && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Сбросить
        </Button>
      )}
    </div>
  );
};
