import Icon from '@/components/ui/icon';
import type { FixedLine } from '@/lib/unitMarginModel';
import { fmtMoney } from '@/lib/unitMarginModel';

interface Props {
  fixed: FixedLine[];
  onChange: (lines: FixedLine[]) => void;
  onSaveDefaults: () => void;
  saving: boolean;
}

/**
 * Постоянные расходы школы за месяц. В маржинальность урока они не входят —
 * нужны ровно для одного вопроса: сколько уроков надо провести, чтобы их
 * закрыть.
 */
export default function UnitFixedCostsForm({
  fixed, onChange, onSaveDefaults, saving,
}: Props) {
  const total = fixed.reduce((s, l) => s + (Number.isFinite(l.amount) ? l.amount : 0), 0);
  const percent = fixed.reduce((s, l) => s + (l.percentOfRevenue || 0), 0);

  const patch = (id: string, p: Partial<FixedLine>) =>
    onChange(fixed.map((l) => (l.id === id ? { ...l, ...p } : l)));

  const remove = (id: string) => onChange(fixed.filter((l) => l.id !== id));

  const add = () =>
    onChange([
      ...fixed,
      { id: `x${Date.now()}`, label: '', amount: 0 },
    ]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon name="Building2" size={17} className="text-gray-500" />
          <div>
            <h3 className="font-semibold text-gray-900">Постоянные расходы школы</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Не зависят от числа уроков. Их и надо закрыть маржой
            </p>
          </div>
        </div>
        <button
          onClick={onSaveDefaults}
          disabled={saving}
          className="text-xs px-3 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-60 flex items-center gap-1.5 shrink-0"
        >
          <Icon
            name={saving ? 'Loader2' : 'Save'}
            size={14}
            className={saving ? 'animate-spin' : ''}
          />
          Запомнить
        </button>
      </div>

      <div className="space-y-2">
        {fixed.map((l) => (
          <div key={l.id} className="flex items-center gap-2">
            <input
              value={l.label}
              onChange={(e) => patch(l.id, { label: e.target.value })}
              placeholder="статья расхода"
              className="flex-1 min-w-0 border border-gray-300 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <div className="relative w-36 shrink-0">
              <input
                type="number"
                step={1000}
                value={Number.isFinite(l.amount) ? l.amount : ''}
                onChange={(e) => patch(l.id, { amount: parseFloat(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-2.5 py-2 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                ₽
              </span>
            </div>
            <div className="relative w-24 shrink-0">
              <input
                type="number"
                step={0.1}
                value={l.percentOfRevenue ?? ''}
                placeholder="0"
                onChange={(e) =>
                  patch(l.id, { percentOfRevenue: parseFloat(e.target.value) || undefined })
                }
                className="w-full border border-gray-300 rounded-md px-2.5 py-2 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                %
              </span>
            </div>
            <button
              onClick={() => remove(l.id)}
              className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
            >
              <Icon name="Trash2" size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={add}
          className="text-xs px-2.5 py-1.5 rounded-md border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 flex items-center gap-1.5"
        >
          <Icon name="Plus" size={14} />
          Добавить статью
        </button>
        <div className="text-sm text-gray-700">
          Итого в месяц: <b>{fmtMoney(total)}</b>
          {percent > 0 && (
            <span className="text-gray-500"> + {percent}% от выручки</span>
          )}
        </div>
      </div>

      <p className="text-[11px] text-gray-400 leading-snug">
        Колонка «%» — для расходов, которые растут вместе с выручкой (например
        надбавка РУО). Они вычитаются из вклада каждого урока, поэтому
        безубыточность наступает позже.
      </p>
    </div>
  );
}
