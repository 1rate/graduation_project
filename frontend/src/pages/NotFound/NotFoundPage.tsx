import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import { Button } from "@/shared/ui/button";

export const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">
          Страница не найдена. Возможно, она была удалена или вы перешли по неверной ссылке.
        </p>
        <Button asChild>
          <Link to="/">Вернуться на дашборд</Link>
        </Button>
      </div>
    </div>
  );
};
