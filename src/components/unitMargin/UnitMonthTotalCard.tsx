import Icon from '@/components/ui/icon';
import {
  UnitMonthTotals, fmtMoney, fmtPercent, monthLabel,
} from '@/lib/unitMarginModel';

interface Props {
  totals: UnitMonthTotals;
  month: string;
}

/**
 * Итог месяца целиком: средняя маржинальность по ВСЕМ урокам.
 *
 * Карточки выше показывают экономику одного занятия каждой формы, но
 * руководителю нужна одна цифра «как сработала школа». Считаем её
 * средневзвешенно — по сумме выручки и расходов всех уроков, а не как
 * среднее двух процентов: занятий разных форм разное количество.
 */
export default function UnitMonthTotalCard({ totals, month }: Props) {
  const positive = totals.margin >= 0;
  const share = (v: number) =>
    totals.margin !== 0 ? Math.round((v / totals.margin) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-emerald-200 bg-emerald-50/60 text-emerald-900">
        <div className="flex items-center gap-2">
          <Icon name="Sigma" size={17} />
          <h3 className="font-semibold">Средняя маржинальность за месяц</h3>
        </div>
        <p className="text-xs opacity-70 mt-0.5">
          все уроки {monthLabel(month)} вместе — {totals.lessons} занятий
        </p>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="text-xs text-gray-500">Маржинальность всех уроков</div>
            <div
              className={`text-3xl font-bold ${positive ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {fmtPercent(totals.marginPercent)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Маржа за месяц</div>
            <div
              className={`text-xl font-bold ${positive ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {fmtMoney(totals.margin)}
            </div>
          </div>
        </div>

        <div className="space-y-1.5 text-sm font-mono text-gray-700 border-t border-gray-100 pt-3">
          <div className="flex justify-between font-semibold text-gray-900">
            <span>Выручка месяца</span>
            <span>{fmtMoney(totals.revenue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">− Переменные расходы</span>
            <span>−{fmtMoney(totals.costTotal)}</span>
          </div>
          <div
            className={`flex justify-between border-t-2 border-gray-300 pt-1.5 font-bold ${
              positive ? 'text-emerald-700' : 'text-red-700'
            }`}
          >
            <span>= Маржинальная прибыль</span>
            <span>
              {fmtMoney(totals.margin)} ({fmtPercent(totals.marginPercent)})
            </span>
          </div>
          {totals.tax > 0 && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">− Налог УСН</span>
                <span>−{fmtMoney(totals.tax)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5 font-semibold">
                <span>= После налога</span>
                <span>
                  {fmtMoney(totals.profit)} ({fmtPercent(totals.profitPercent)})
                </span>
              </div>
            </>
          )}
        </div>

        {/* Кто приносит маржу: разбивка по формам занятий */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-blue-50/60 p-3">
            <div className="text-[11px] text-gray-500">Индивидуальные</div>
            <div className="text-sm font-semibold text-gray-900 mt-0.5">
              {fmtMoney(totals.individualMargin)}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              {totals.individualLessons} зан. · {share(totals.individualMargin)}% маржи
            </div>
          </div>
          <div className="rounded-lg bg-violet-50/60 p-3">
            <div className="text-[11px] text-gray-500">Групповые</div>
            <div className="text-sm font-semibold text-gray-900 mt-0.5">
              {fmtMoney(totals.groupMargin)}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              {totals.groupLessons} зан. · {share(totals.groupMargin)}% маржи
            </div>
          </div>
        </div>

        <div className="text-[11px] text-gray-400 leading-relaxed border-t border-gray-100 pt-3">
          Средняя считается по сумме денег, а не как среднее двух процентов:
          занятий разных форм разное количество. Диагностики в расчёт не входят —
          у них своя экономика.
        </div>
      </div>
    </div>
  );
}
