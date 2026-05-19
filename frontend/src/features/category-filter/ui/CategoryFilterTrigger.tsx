import { CategoryFilterModal } from "@/features/category-filter/ui/CategoryFilterModal";
import { Button } from "@/shared/ui/button";
import { Filter } from "lucide-react";
import { useState } from "react";

export const CategoryFilterTrigger = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Filter className="mr-2 h-4 w-4" />
        Категории
      </Button>
      <CategoryFilterModal open={open} onOpenChange={setOpen} />
    </>
  );
};
