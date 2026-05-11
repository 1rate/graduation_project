import { queryClient } from "@/shared/api";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  );
};
