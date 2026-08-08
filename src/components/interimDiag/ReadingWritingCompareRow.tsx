import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { ProcessDynamic } from './impairedProcesses';

export function DynamicArrow({ dyn }: { dyn: ProcessDynamic }) {
  if (dyn === 'up') return <Icon name="ArrowUp" size={18} className="text-green-600" />;
  if (dyn === 'down') return <Icon name="ArrowDown" size={18} className="text-red-600" />;
  return null;
}

export interface CompareRowProps {
  label: string;
  unit?: string;
  from: string;
  fromEditable: boolean;
  to: string;
  dyn: ProcessDynamic;
  // Подпись под строкой: пересчёт ошибок на 100 слов
  note?: string;
  hint?: string;
  onFromChange: (v: string) => void;
  onChange: (v: string) => void;
}

export default function CompareRow({
  label,
  unit,
  from,
  fromEditable,
  to,
  dyn,
  note,
  hint,
  onFromChange,
  onChange,
}: CompareRowProps) {
  return (
    <div>
      <Label className="text-sm text-gray-700">{label}</Label>
      {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {fromEditable ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              inputMode="numeric"
              value={from}
              onChange={(e) => onFromChange(e.target.value)}
              className="w-28"
              placeholder="было"
            />
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
        ) : (
          <span className="text-sm text-gray-500 min-w-[70px]">
            {`${from}${unit ? ' ' + unit : ''}`}
          </span>
        )}
        <Icon name="ArrowRight" size={16} className="text-gray-400" />
        <Input
          type="number"
          inputMode="numeric"
          value={to}
          onChange={(e) => onChange(e.target.value)}
          className="w-28"
          placeholder="0"
        />
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
        <DynamicArrow dyn={dyn} />
      </div>
      {note && <p className="mt-1 text-xs text-gray-600">{note}</p>}
    </div>
  );
}