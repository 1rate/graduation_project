import { DatePickerClearable } from "@/shared/components/DatePicker";
import type { SentimentLabel } from "@/shared/types/api";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { RotateCcw, X } from "lucide-react";

interface SearchFiltersProps {
  from: string;
  to: string;
  sentiment: SentimentLabel | "";
  q: string | "";
  categories: string[];
  availableCategories: string[];
  onFromChange: (from: string) => void;
  onToChange: (to: string) => void;
  onSentimentChange: (sentiment: SentimentLabel | "") => void;
  onCategoriesChange: (categories: string[]) => void;
  onReset: () => void;
}

const sentimentOptions: Array<{
  value: SentimentLabel;
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  activeClass: string;
}> = [
  {
    value: "positive",
    label: "Позитив",
    variant: "outline",
    activeClass: "bg-green-500 text-white hover:bg-green-600 border-green-500",
  },
  {
    value: "neutral",
    label: "Нейтрал",
    variant: "outline",
    activeClass: "bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500",
  },
  {
    value: "negative",
    label: "Негатив",
    variant: "outline",
    activeClass: "bg-red-500 text-white hover:bg-red-600 border-red-500",
  },
];

const hasFilters = (from: string, to: string, sentiment: string, q: string, categories: string[]) =>
  from || to || sentiment || q || categories.length > 0;

export const SearchFilters = ({
  from,
  to,
  sentiment,
  q,
  categories,
  availableCategories,
  onFromChange,
  onToChange,
  onSentimentChange,
  onCategoriesChange,
  onReset,
}: SearchFiltersProps) => {
  console.log(categories);
  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-wrap items-center gap-3 w-full">
        <div className="flex items-end gap-2">
          <DatePickerClearable value={from} onChange={onFromChange} placeholder="MM.ДД.ГГГГ" />
          <span className="text-lg text-muted-foreground pb-1">—</span>
          <DatePickerClearable value={to} onChange={onToChange} placeholder="MM.ДД.ГГГГ" />
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {sentimentOptions.map((opt) => (
            <Badge
              key={opt.value}
              variant="outline"
              className={`cursor-pointer select-none ${
                sentiment === opt.value ? opt.activeClass : ""
              }`}
              onClick={() => onSentimentChange(sentiment === opt.value ? "" : opt.value)}
            >
              {opt.label}
            </Badge>
          ))}
        </div>

        {hasFilters(from, to, sentiment, q, categories) && (
          <Button variant="secondary" size="sm" onClick={onReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Сбросить
          </Button>
        )}
      </div>

      <Select
        value=""
        onValueChange={(value) => {
          if (value && !categories.includes(value)) {
            onCategoriesChange([...categories, value]);
          }
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Категории" />
        </SelectTrigger>
        <SelectContent>
          {availableCategories
            .filter((c) => !categories.includes(c))
            .map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {categories.map((cat) => (
            <Button
              onClick={() => onCategoriesChange(categories.filter((c) => c !== cat))}
              variant="ghost"
              className="p-0"
            >
              <Badge key={cat} className="gap-1">
                {cat}
                <X className="h-2 w-2 cursor-pointer" />
              </Badge>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
