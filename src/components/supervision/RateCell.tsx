import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  value: number;
  // Значение задано вручную (а не рассчитано автоматически)
  manual?: boolean;
  disabled?: boolean;
  className?: string;
  hint?: string;
  onSave: (value: number | null) => void;
}

/** Ячейка ставки: показывает сумму, по клику даёт отредактировать. */
const RateCell = ({ value, manual, disabled, className = '', hint, onSave }: Props) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    setEditing(false);
    const num = parseInt(draft, 10);
    if (!Number.isFinite(num) || num < 0) return;
    if (num !== value) onSave(num);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          type="number"
          min={0}
          step={50}
          className="h-9 w-24 px-2 rounded-md border border-emerald-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(String(value));
              setEditing(false);
            }
          }}
        />
        <span className="text-xs text-gray-400">₽/час</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setEditing(true)}
        className={`group flex items-center gap-1.5 rounded px-1 -mx-1 text-left disabled:cursor-not-allowed ${className}`}
        title={disabled ? 'Ставка зафиксирована' : 'Изменить ставку'}
      >
        <span className="font-semibold">{value} ₽/час</span>
        {!disabled && (
          <Icon
            name="Pencil"
            size={13}
            className="text-gray-300 group-hover:text-gray-500 transition-colors"
          />
        )}
      </button>
      {manual && (
        <span
          className="text-[10px] uppercase tracking-wide text-amber-600 bg-amber-50 rounded px-1.5 py-0.5"
          title="Значение задано вручную"
        >
          вручную
        </span>
      )}
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
  );
};

export default RateCell;
