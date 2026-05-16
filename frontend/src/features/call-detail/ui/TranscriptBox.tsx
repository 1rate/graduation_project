import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { FileText } from "lucide-react";

export const TranscriptBox = ({ text }: { text: string }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Текст обращения
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{text}</p>
      </CardContent>
    </Card>
  );
};
