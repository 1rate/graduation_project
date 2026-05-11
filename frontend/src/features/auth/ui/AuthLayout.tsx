import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const AuthLayout = ({ title, description, children, footer }: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">{children}</CardContent>
        {footer && (
          <div className="px-6 pb-6 text-center text-sm text-muted-foreground">{footer}</div>
        )}
      </Card>
    </div>
  );
};
