import { Textarea } from "@/shared/ui/textarea";

interface TextInputProps {
  value: string;
  disabled: boolean;
  onChange: (text: string) => void;
}

export const TextInput = ({ value, disabled, onChange }: TextInputProps) => {
  return (
    <Textarea
      placeholder="Введите текст обращения..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="min-h-[150px]"
    />
  );
};
