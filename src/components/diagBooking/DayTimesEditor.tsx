import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

export interface TimeRow {
  from: string;
  to: string;
}

/** Диагностика длится 2 часа */
export const DIAG_HOURS = 2;

/** «10:00» → «12:00»: конец окна = начало + длительность диагностики */
export const plusDiag = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h)) return '';
  return `${String(Math.min(h + DIAG_HOURS, 23)).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
};

interface Props {
  title: string;
  rows: TimeRow[];
  onChange: (rows: TimeRow[]) => void;
  onRemoveDay: () => void;
  /** Скопировать время предыдущего дня — чтобы не набирать заново, если совпадает */
  onCopyPrev?: () => void;
}

/** Времена одного дня: у каждого дня — свои */
const DayTimesEditor = ({ title, rows, onChange, onRemoveDay, onCopyPrev }: Props) => {
  const setRow = (i: number, patch: Partial<TimeRow>) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const addRow = () => {
    const last = rows[rows.length - 1];
    const from = last?.to || '10:00';
    onChange([...rows, { from, to: plusDiag(from) }]);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-2.5 bg-gray-50/50">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-semibold text-gray-800 capitalize">{title}</span>
        <div className="flex items-center gap-2">
          {onCopyPrev && (
            <button onClick={onCopyPrev} className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1">
              <Icon name="Copy" size={12} />
              как в день выше
            </button>
          )}
          <button onClick={onRemoveDay} className="text-gray-300 hover:text-red-500" title="Убрать день">
            <Icon name="Trash2" size={14} />
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              type="time"
              value={r.from}
              className="h-9 bg-white"
              onChange={(e) => setRow(i, { from: e.target.value, to: plusDiag(e.target.value) })}
            />
            <span className="text-gray-400">—</span>
            <Input
              type="time"
              value={r.to}
              className="h-9 bg-white"
              onChange={(e) => setRow(i, { to: e.target.value })}
            />
            <button
              onClick={() => onChange(rows.filter((_, j) => j !== i))}
              disabled={rows.length === 1}
              className="text-gray-300 hover:text-red-500 disabled:opacity-30 p-1"
              title="Убрать время"
            >
              <Icon name="X" size={15} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={addRow} className="mt-1.5 text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
        <Icon name="Plus" size={13} />
        Ещё время
      </button>
    </div>
  );
};

export default DayTimesEditor;
