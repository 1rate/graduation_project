import { CallDetailContent } from "@/features/call-detail";
import { Page } from "@/shared/components/Page";
import { Button } from "@/shared/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export const CallDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <Page>
      <Button variant="ghost" onClick={() => navigate(-1)} className="w-fit">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>
      <CallDetailContent id={id!} />
    </Page>
  );
};
