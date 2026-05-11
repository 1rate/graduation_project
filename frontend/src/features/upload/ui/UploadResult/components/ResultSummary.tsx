import { CheckCircle, XCircle } from "lucide-react";

interface ResultSummaryProps {
  success: number;
  failed: number;
}

export const ResultSummary = ({ success, failed }: ResultSummaryProps) => {
  return (
    <div className="text-center space-y-2">
      {failed === 0 ? (
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
      ) : (
        <div className="flex justify-center gap-2">
          <XCircle className="h-12 w-12 text-yellow-500" />
        </div>
      )}
      <h3 className="text-lg font-semibold">Загрузка завершена</h3>
      <p className="text-sm text-muted-foreground">
        Успешно: {success}
        {failed > 0 && ` · С ошибками: ${failed}`}
      </p>
    </div>
  );
};
