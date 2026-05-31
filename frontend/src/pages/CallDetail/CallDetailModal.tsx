import { CallDetailContent } from "@/features/call-detail";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";

interface CallDetailModalProps {
  id: string | null;
  open: boolean;
  onClose: () => void;
}

export const CallDetailModal = ({ id, open, onClose }: CallDetailModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Обращение #{id?.slice(0, 8)}</DialogTitle>
        </DialogHeader>
        {id && <CallDetailContent id={id} compact />}
      </DialogContent>
    </Dialog>
  );
};
