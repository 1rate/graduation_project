import { Badge } from "@/shared/ui/badge";
import { Tag } from "lucide-react";

export const CategoryBadge = ({ category, score }: { category: string; score: number }) => {
  return (
    <Badge variant="outline">
      <Tag className="mr-1 h-3 w-3" />
      {category} {(score * 100).toFixed(0)}%
    </Badge>
  );
};
