import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar = ({
  value,
  onChange,
  placeholder = "Поиск по тексту обращения...",
}: SearchBarProps) => {
  const [local, setLocal] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      setLocal(value);
      prevValue.current = value;
    }
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== value) {
        onChange(local);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [local]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClear = () => {
    setLocal("");
    onChange("");
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={local}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10"
      />
      {local && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
