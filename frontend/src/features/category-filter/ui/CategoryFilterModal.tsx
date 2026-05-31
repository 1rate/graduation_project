import type { CategoryItem } from "@/features/category-filter/model/category.types";
import {
  useCategoryCatalog,
  useSetUserCategories,
  useUserCategories,
} from "@/features/category-filter/model/useCategoryFilter";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

interface CategoryFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CategoryFilterModal = ({ open, onOpenChange }: CategoryFilterModalProps) => {
  const { data: catalog, isLoading: catalogLoading } = useCategoryCatalog();
  const { data: userData, isLoading: userLoading } = useUserCategories();
  const { mutate: save, isPending: isSaving } = useSetUserCategories();

  const initialIds = useMemo(() => {
    if (userData?.categories) {
      return new Set(userData.categories.map((c) => c.id));
    }
    return new Set<number>();
  }, [userData]);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(initialIds);

  const [prevUserData, setPrevUserData] = useState(userData);
  if (userData !== prevUserData) {
    setPrevUserData(userData);
    if (userData?.categories) {
      setSelectedIds(new Set(userData.categories.map((c) => c.id)));
    }
  }

  const toggle = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = () => {
    save(Array.from(selectedIds), {
      onSuccess: () => onOpenChange(false),
    });
  };

  const isLoading = catalogLoading || userLoading;
  const categories = catalog?.categories ?? [];
  const grouped = categories.reduce<Record<string, CategoryItem[]>>((acc, cat) => {
    (acc[cat.domain] ??= []).push(cat);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Категории анализа</DialogTitle>
          <DialogDescription>
            Выберите категории, которые будут использоваться при анализе ваших обращений. Если не
            выбрана ни одна категория — анализ выполняться не будет.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="max-h-[50vh] overflow-y-auto px-6">
            <div className="space-y-6 py-2">
              {Object.entries(grouped).map(([domain, items]) => (
                <div key={domain}>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {domain}
                  </h4>
                  <div className="space-y-1">
                    {items.map((cat) => (
                      <label
                        key={cat.id}
                        className="flex items-center gap-3 cursor-pointer rounded-md p-2 hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          checked={selectedIds.has(cat.id)}
                          onCheckedChange={() => toggle(cat.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{cat.name}</p>
                        </div>
                        {/* {selectedIds.has(cat.id) && (
                          <Badge variant="default" className="shrink-0">
                            <Check className="h-3 w-3 mr-1" />
                            Выбрано
                          </Badge>
                        )} */}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isSaving || selectedIds.size === 0}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
