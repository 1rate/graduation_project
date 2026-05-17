import { Button } from "@/shared/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  total: number;
  size: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ page, total, size, onPageChange }: PaginationProps) => {
  const totalPages = Math.ceil(total / size);

  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Показываем только ближайшие страницы
  const visiblePages = pages.filter((p) => {
    if (p === 1 || p === totalPages) return true;
    return Math.abs(p - page) <= 1;
  });

  // Добавляем многоточия
  const withDots: Array<number | "..."> = [];
  visiblePages.forEach((p, i) => {
    if (i > 0 && p - (visiblePages[i - 1] ?? 0) > 1) {
      withDots.push("...");
    }
    withDots.push(p);
  });

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Страница {page} из {totalPages} · Всего {total} обращений
      </span>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {withDots.map((p, i) =>
          p === "..." ? (
            <span key={`dot-${i}`} className="px-2 py-1">
              ...
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
