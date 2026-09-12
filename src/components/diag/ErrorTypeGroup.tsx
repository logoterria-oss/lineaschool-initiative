import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { NO_ERRORS, UNDETECTABLE, EXCLUSIVE_OPTIONS } from '@/lib/errorCount';

interface ErrorTypeGroupProps {
  idPrefix: string;
  field: string;
  label: string;
  options: string[];
  selected: string[];
  onCheckboxChange: (field: string, value: string, checked: boolean) => void;
  onInputChange: (field: string, value: string | string[]) => void;
  children?: React.ReactNode;
}

export default function ErrorTypeGroup({
  idPrefix,
  field,
  label,
  options,
  selected,
  onCheckboxChange,
  onInputChange,
  children,
}: ErrorTypeGroupProps) {
  const handle = (option: string, checked: boolean) => {
    // «нет» и «невозможно определить» исключают всё остальное и друг друга
    if (EXCLUSIVE_OPTIONS.includes(option)) {
      onInputChange(field, checked ? [option] : []);
      return;
    }
    if (checked) {
      const cleaned = selected.filter((v) => !EXCLUSIVE_OPTIONS.includes(v));
      onInputChange(field, [...cleaned, option]);
      return;
    }
    onCheckboxChange(field, option, false);
  };

  const allOptions = [NO_ERRORS, UNDETECTABLE, ...options.filter((o) => o !== NO_ERRORS)];

  return (
    <div className="ml-4">
      <Label className="text-base font-semibold">{label}</Label>
      <div className="mt-2 space-y-2">
        {allOptions.map((option) => (
          <div key={option} className="flex items-start space-x-2">
            <Checkbox
              id={`${idPrefix}-${option}`}
              checked={selected.includes(option)}
              onCheckedChange={(checked) => handle(option, !!checked)}
              className="mt-0.5"
            />
            <Label htmlFor={`${idPrefix}-${option}`} className="text-sm leading-5 cursor-pointer">
              {option}
            </Label>
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}
