import Icon from '@/components/ui/icon';
import type { UnitMarginReport as SavedReport } from '@/lib/unitMarginApi';
import { fmtPercent, monthLabel } from '@/lib/unitMarginModel';

interface Props {
  reports: SavedReport[];
  onOpenMonth: (month: string) => void;
}

/**
 * Зафиксированные месяцы: каждый завершённый месяц сохраняется автоматически
 * один раз и больше не меняется. По ним строится «Статистика и динамика».
 */
export default function UnitReportsHistory({ reports, onOpenMonth }: Props) {
  if (reports.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-900">
        Зафиксированные месяцы ({reports.length})
        <p className="text-xs font-normal text-gray-500 mt-0.5">
          Фиксируются автоматически после окончания месяца и больше не меняются
        </p>
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
                все уроки {fmtPercent(r.result?.monthTotals?.marginPercent ?? 0)} ·
                инд. {fmtPercent(r.result?.individual?.marginPercent ?? 0)} ·
                гр. {fmtPercent(r.result?.group?.marginPercent ?? 0)} ·
                зафиксирован {new Date(r.created_at).toLocaleDateString('ru-RU')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onOpenMonth(r.period_month)}
                className="text-xs px-2.5 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Открыть месяц
              </button>
              <Icon name="Lock" size={14} className="text-gray-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
