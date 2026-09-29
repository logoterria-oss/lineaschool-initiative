import Icon from '@/components/ui/icon';
import type { UnitMarginReport as SavedReport } from '@/lib/unitMarginApi';
import { fmtPercent, monthLabel } from '@/lib/unitMarginModel';

interface Props {
  reports: SavedReport[];
  onOpenMonth: (month: string) => void;
  onDelete: (r: SavedReport) => void;
}

/** История сохранённых расчётов: по ним строится динамика по месяцам. */
export default function UnitReportsHistory({ reports, onOpenMonth, onDelete }: Props) {
  if (reports.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-900">
        Сохранённые расчёты ({reports.length})
      </div>
      <div className="divide-y divide-gray-100">
        {reports.map((r) => (
          <div
            key={r.id}
            className="px-5 py-3 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900">
                {monthLabel(r.period_month)}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                инд. {fmtPercent(r.result?.individual?.marginPercent ?? 0)} ·
                гр. {fmtPercent(r.result?.group?.marginPercent ?? 0)}
                {r.note ? ` · ${r.note}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onOpenMonth(r.period_month)}
                className="text-xs px-2.5 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Открыть месяц
              </button>
              <button
                onClick={() => onDelete(r)}
                className="text-gray-300 hover:text-red-500 transition-colors"
              >
                <Icon name="Trash2" size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
