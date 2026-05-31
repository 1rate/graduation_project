import { Card, CardContent } from "@/shared/ui/card";

interface SummaryConclusionProps {
  text: string;
}

export const SummaryConclusion = ({ text }: SummaryConclusionProps) => {
  return (
    <Card>
      <CardContent className="p-4 text-sm font-medium">{text}</CardContent>
    </Card>
  );
};
