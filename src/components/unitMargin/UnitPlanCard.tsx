import Icon from '@/components/ui/icon';
import type { UnitPlanMonth } from '@/lib/unitMarginApi';
import {
  UnitMarginResults, calcMonthTotals, fmtMoney, fmtPercent, monthLabel,
} from '@/lib/unitMarginModel';

interface Props {
  plan: UnitPlanMonth[];
  result: UnitMarginResults;
  baseMonth: string;
  loading: boolean;
  onRefresh: () => void;
}

/**
 * План маржинальности на следующие месяцы.
 *
 * Количество занятий — РЕАЛЬНОЕ, из расписания CRM (статус «запланировано»).
 * Экономику одного занятия берём из выбранного месяца: цену места,
 * наполняемость и ставки. То есть ответ на вопрос «сколько заработаем,
 * если всё пойдёт как сейчас», а не обещание: часть занятий отменят
 * или перенесут, а цены могут измениться.
 */
export default function UnitPlanCard({
  plan, result, baseMonth, loading, onRefresh,
}: Props) {
  const rows = plan.map((p) => ({
    plan: p,
    totals: calcMonthTotals(result, p.individual_lessons, p.group_lessons),
  }));

  const totalMargin = rows.reduce((s, r) => s + r.totals.margin, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.totals.revenue, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-amber-200 bg-amber-50/60 text-amber-900 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Icon name="CalendarClock" size={17} />
            <h3 className="font-semibold">План на следующие месяцы</h3>
          </div>
          <p className="text-xs opacity-70 mt-0.5">
            по занятиям из расписания CRM, экономика — как в {monthLabel(baseMonth)}
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-xs px-2.5 py-1.5 rounded-md border border-amber-300 text-amber-800 hover:bg-amber-100 disabled:opacity-60 flex items-center gap-1.5 whitespace-nowrap"
        >
          <Icon
            name={loading ? 'Loader2' : 'RefreshCw'}
            size={13}
            className={loading ? 'animate-spin' : ''}
          />
          Обновить
        </button>
      </div>

      {loading && rows.length === 0 ? (
        <div className="p-10 text-center text-gray-400 text-sm">
          <Icon name="Loader2" size={22} className="animate-spin mx-auto mb-2" />
          Смотрим расписание в CRM…
        </div>
      ) : rows.length === 0 ? (
        <div className="p-10 text-center text-gray-400 text-sm">
          В расписании CRM пока нет запланированных занятий на будущие месяцы
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase text-gray-400 border-b border-gray-100">
                  <th className="text-left font-medium px-5 py-2.5">Месяц</th>
                  <th className="text-right font-medium px-3 py-2.5">Занятий</th>
                  <th className="text-right font-medium px-3 py-2.5">Выручка</th>
                  <th className="text-right font-medium px-3 py-2.5">Маржа</th>
                  <th className="text-right font-medium px-5 py-2.5">Маржин.</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ plan: p, totals }) => (
                  <tr key={p.month} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">
                        {monthLabel(p.month)}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {p.done_lessons > 0
                          ? `${p.done_lessons} проведено, ${p.planned_lessons} впереди`
                          : `${p.planned_lessons} в расписании`}
                      </div>
                    </td>
                    <td className="text-right px-3 py-3 text-gray-700">
                      <div>{totals.lessons}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {p.individual_lessons} инд. / {p.group_lessons} гр.
                      </div>
                    </td>
                    <td className="text-right px-3 py-3 text-gray-700">
                      {fmtMoney(totals.revenue)}
                    </td>
                    <td
                      className={`text-right px-3 py-3 font-semibold ${
                        totals.margin >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {fmtMoney(totals.margin)}
                    </td>
                    <td
                      className={`text-right px-5 py-3 font-semibold ${
                        totals.marginPercent >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {fmtPercent(totals.marginPercent)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold text-gray-900">
                  <td className="px-5 py-3">Итого за период</td>
                  <td className="text-right px-3 py-3">
                    {rows.reduce((s, r) => s + r.totals.lessons, 0)}
                  </td>
                  <td className="text-right px-3 py-3">{fmtMoney(totalRevenue)}</td>
                  <td
                    className={`text-right px-3 py-3 ${
                      totalMargin >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {fmtMoney(totalMargin)}
                  </td>
                  <td className="text-right px-5 py-3">
                    {fmtPercent(
                      totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0,
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="px-5 py-3 text-[11px] text-gray-400 leading-relaxed border-t border-gray-100">
            Это ожидание, а не обещание: занятия из расписания могут отменить или
            перенести, а цены и ставки — измениться. Текущий месяц считается
            вместе с уже проведёнными занятиями.
          </div>
        </>
      )}
    </div>
  );
}
