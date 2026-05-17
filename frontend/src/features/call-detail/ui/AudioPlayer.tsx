import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Volume2 } from "lucide-react";

export const AudioPlayer = ({ url }: { url: string }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Volume2 className="h-4 w-4" />
          Аудиозапись
        </CardTitle>
      </CardHeader>
      <CardContent>
        <audio controls className="w-full" src={url}>
          Ваш браузер не поддерживает аудиоплеер.
        </audio>
      </CardContent>
    </Card>
  );
};
