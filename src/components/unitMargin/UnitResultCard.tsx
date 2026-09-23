import Icon from '@/components/ui/icon';
import { UnitMarginResult, fmtMoney2, fmtPercent } from '@/lib/unitMarginModel';
import type { UnitFactSide } from '@/lib/unitMarginApi';

interface Props {
  result: UnitMarginResult;
  fact?: UnitFactSide;
  showFormula: boolean;
}

const TITLES: Record<string, { title: string; sub: string; icon: string; accent: string }> = {
  individual: {
    title: 'Индивидуальное занятие',
    sub: 'юнит = один проведённый урок',
    icon: 'User',
    accent: 'blue',
  },
  group: {
    title: 'Групповое занятие',
    sub: 'юнит = один урок на одного ребёнка',
    icon: 'Users',
    accent: 'violet',
  },
};

/** Карточка экономики одного юнита: цена, расходы, маржа. */
export default function UnitResultCard({ result, fact, showFormula }: Props) {
  const meta = TITLES[result.form];
  const positive = result.margin >= 0;
  const accent = meta.accent === 'blue'
    ? 'border-blue-200 bg-blue-50/50 text-blue-900'
    : 'border-violet-200 bg-violet-50/50 text-violet-900';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className={`px-5 py-3.5 border-b ${accent}`}>
        <div className="flex items-center gap-2">
          <Icon name={meta.icon as never} size={17} />
          <h3 className="font-semibold">{meta.title}</h3>
        </div>
        <p className="text-xs opacity-70 mt-0.5">{meta.sub}</p>
      </div>

      <div className="p-5 space-y-4">
        {/* Главная цифра */}
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="text-xs text-gray-500">Маржинальность урока</div>
            <div
              className={`text-3xl font-bold ${positive ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {fmtPercent(result.marginPercent)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Маржа с урока</div>
            <div
              className={`text-xl font-bold ${positive ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {fmtMoney2(result.margin)}
            </div>
          </div>
        </div>

        {/* Разбор */}
        <div className="space-y-1.5 text-sm font-mono text-gray-700 border-t border-gray-100 pt-3">
          <div className="flex justify-between font-semibold text-gray-900">
            <span>Цена урока</span>
            <span>{fmtMoney2(result.price)}</span>
          </div>
          {result.costRows.map((r, i) => (
            <div key={`${r.label}-${i}`}>
              <div className="flex justify-between">
                <span className="text-gray-600">− {r.label}</span>
                <span>−{fmtMoney2(r.value)}</span>
              </div>
              {showFormula && (
                <div className="text-[11px] text-gray-400 pl-3.5">{r.formula}</div>
              )}
              {showFormula && r.hint && (
                <div className="text-[11px] text-gray-400 pl-3.5 italic font-sans">
                  {r.hint}
                </div>
              )}
            </div>
          ))}
          <div className="flex justify-between border-t border-gray-200 pt-1.5">
            <span className="text-gray-600">= Переменные расходы</span>
            <span>{fmtMoney2(result.costTotal)}</span>
          </div>
          <div
            className={`flex justify-between border-t-2 border-gray-300 pt-1.5 font-bold ${
              positive ? 'text-emerald-700' : 'text-red-700'
            }`}
          >
            <span>= Маржинальная прибыль</span>
            <span>
              {fmtMoney2(result.margin)} ({fmtPercent(result.marginPercent)})
            </span>
          </div>
          {result.tax > 0 && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">− Налог УСН</span>
                <span>−{fmtMoney2(result.tax)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5 font-semibold">
                <span>= После налога</span>
                <span>
                  {fmtMoney2(result.profit)} ({fmtPercent(result.profitPercent)})
                </span>
              </div>
            </>
          )}
        </div>

        {/* Служебные показатели */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-[11px] text-gray-500">Безубыточная цена</div>
            <div className="text-sm font-semibold text-gray-900 mt-0.5">
              {fmtMoney2(result.breakEvenPrice)}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              {result.price >= result.breakEvenPrice
                ? `запас ${fmtMoney2(result.price - result.breakEvenPrice)}`
                : `не хватает ${fmtMoney2(result.breakEvenPrice - result.price)}`}
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-[11px] text-gray-500">Фонд оплаты труда в цене</div>
            <div className="text-sm font-semibold text-gray-900 mt-0.5">
              {fmtPercent(result.payrollShare)}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              зарплата + взносы + отпускные
            </div>
          </div>
        </div>

        {/* Факт месяца */}
        {fact && (
          <div className="text-[11px] text-gray-500 border-t border-gray-100 pt-3 leading-relaxed">
            Факт месяца: {fact.lessons} занятий, {fact.units} оплачиваемых единиц,{' '}
            {fact.students} учеников, списано{' '}
            {Math.round(fact.revenue).toLocaleString('ru-RU')} ₽.
            {fact.free_units > 0 && (
              <>
                {' '}Из них {fact.free_units} без списания (отработки, бонусы) — они
                тянут среднюю цену вниз: по платным средняя{' '}
                {fmtMoney2(fact.avg_price_paid)}.
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
