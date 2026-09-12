import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { UNCOUNTABLE, UNCOUNTABLE_LABEL, isUncountable } from '@/lib/errorCount';

interface ErrorCountFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export default function ErrorCountField({ id, label, value, onChange }: ErrorCountFieldProps) {
  const uncountable = isUncountable(value);

  return (
    <div>
      <Label htmlFor={id} className="text-base font-semibold">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        value={uncountable ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        disabled={uncountable}
        className="mt-2 w-32"
        min="0"
      />
      <div className="flex items-center space-x-2 mt-2">
        <Checkbox
          id={`${id}-uncountable`}
          checked={uncountable}
          onCheckedChange={(checked) => onChange(checked ? UNCOUNTABLE : '')}
        />
        <Label htmlFor={`${id}-uncountable`} className="text-sm cursor-pointer">
          {UNCOUNTABLE_LABEL}
        </Label>
      </div>
    </div>
  );
}
