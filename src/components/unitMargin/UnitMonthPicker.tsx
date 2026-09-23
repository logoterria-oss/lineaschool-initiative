import Icon from '@/components/ui/icon';
import { monthLabel, recentMonths } from '@/lib/unitMarginModel';
import type { UnitFact } from '@/lib/unitMarginApi';

interface Props {
  month: string;
  onMonthChange: (m: string) => void;
  fact: UnitFact | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
}

/**
 * Единственный ввод отчёта — месяц. Всё остальное приезжает из CRM:
 * сколько занятий провели и сколько за них списали.
 */
export default function UnitMonthPicker({
  month, onMonthChange, fact, loading, error, onRefresh,
}: Props) {
  const months = recentMonths(24);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Отчётный месяц</label>
          <select
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-4 py-2.5 rounded-md border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60 flex items-center gap-1.5 whitespace-nowrap"
        >
          <Icon
            name={loading ? 'Loader2' : 'RefreshCw'}
            size={15}
            className={loading ? 'animate-spin' : ''}
          />
          Обновить из CRM
        </button>
      </div>

      {error && (
        <div className="mt-3 text-sm text-red-600 flex items-center gap-1.5">
          <Icon name="TriangleAlert" size={15} />
          {error}
        </div>
      )}

      {fact && !loading && (
        <div className="mt-4 pt-4 border-t border-gray-100 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 text-[13px] text-gray-600">
          <div>
            Индивидуальных: <b className="text-gray-900">{fact.individual.lessons}</b> зан.
          </div>
          <div>
            Групповых: <b className="text-gray-900">{fact.group.lessons}</b> зан. /{' '}
            <b className="text-gray-900">{fact.group.units}</b> посещений
          </div>
          <div>
            Средняя группа: <b className="text-gray-900">{fact.group.avg_group_size} чел.</b>
          </div>
          <div>
            Диагностик (исключены):{' '}
            <b className="text-gray-900">{fact.diag_lessons}</b>
          </div>
        </div>
      )}
    </div>
  );
}
