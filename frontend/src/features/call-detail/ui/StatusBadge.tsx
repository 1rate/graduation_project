import type { MessageStatus } from "@/shared/types/api";
import { Badge } from "@/shared/ui/badge";

const statusConfig: Record<
  MessageStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "В обработке", variant: "secondary" },
  transcribed: { label: "Текст получен", variant: "secondary" },
  enriched: { label: "Завершён", variant: "default" },
  failed: { label: "Ошибка", variant: "destructive" },
};

export const StatusBadge = ({ status }: { status: MessageStatus }) => {
  const config = statusConfig[status] ?? statusConfig.pending;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};
