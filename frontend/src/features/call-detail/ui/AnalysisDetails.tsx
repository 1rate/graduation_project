import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";
import { BarChart3 } from "lucide-react";

interface AnalysisDetailsProps {
  sentimentLabel: string;
  sentimentScore: number;
  sentimentModel: string;
  category: string;
  categoryScore: number;
  categoryModel: string;
}

export const AnalysisDetails = ({
  sentimentLabel,
  sentimentScore,
  sentimentModel,
  category,
  categoryScore,
  categoryModel,
}: AnalysisDetailsProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4" />
          Детали анализа
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Тональность: {sentimentLabel}</span>
            <span className="text-muted-foreground">{(sentimentScore * 100).toFixed(0)}%</span>
          </div>
          <Progress value={sentimentScore * 100} />
          <p className="text-xs text-muted-foreground">Модель: {sentimentModel}</p>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Категория: {category}</span>
            <span className="text-muted-foreground">{(categoryScore * 100).toFixed(0)}%</span>
          </div>
          <Progress value={categoryScore * 100} />
          <p className="text-xs text-muted-foreground">Модель: {categoryModel}</p>
        </div>
      </CardContent>
    </Card>
  );
};
