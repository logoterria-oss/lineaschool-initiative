import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { CalcRow, MarginResult, fmtMoney, fmtMoney2, fmtPercent } from '@/lib/marginModel';

interface Props {
  result: MarginResult;
}

const Rows = ({ rows, showFormula }: { rows: CalcRow[]; showFormula: boolean }) => (
  <div className="divide-y divide-gray-100">
    {rows.map((r, i) => (
      <div key={`${r.label}-${i}`} className="py-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-gray-700">{r.label}</span>
          <span
            className={`text-sm font-medium whitespace-nowrap ${
              r.value < 0 ? 'text-emerald-600' : 'text-gray-900'
            }`}
          >
            {fmtMoney(r.value)}
          </span>
        </div>
        {showFormula && (
          <div className="text-xs text-gray-400 mt-0.5 font-mono">{r.formula}</div>
        )}
        {showFormula && r.hint && (
          <div className="text-xs text-gray-400 mt-0.5 italic">{r.hint}</div>
        )}
      </div>
    ))}
  </div>
);

const Block = ({
  title, icon, color, total, rows, showFormula,
}: {
  title: string;
  icon: string;
  color: string;
  total: string;
  rows: CalcRow[];
  showFormula: boolean;
}) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <Icon name={icon as never} size={17} className={color} />
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="text-base font-bold text-gray-900">{total}</div>
    </div>
    <Rows rows={rows} showFormula={showFormula} />
  </div>
);

export default function MarginResultView({ result }: Props) {
  const [showFormula, setShowFormula] = useState(true);

  const positive = result.netProfit >= 0;

  const kpis = [
    {
      label: 'Выручка с ученика',
      value: fmtMoney(result.revenue),
      sub: `${result.lessonsPerMonth} зан./мес. по ${fmtMoney2(result.pricePerLesson)}`,
      tone: 'text-gray-900',
    },
    {
      label: 'Валовая прибыль',
      value: fmtMoney(result.grossProfit),
      sub: `маржа ${fmtPercent(result.grossMarginPercent)} — после прямых расходов`,
      tone: result.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600',
    },
    {
      label: 'Чистая прибыль',
      value: fmtMoney(result.netProfit),
      sub: `маржа ${fmtPercent(result.netMarginPercent)} — после косвенных и налога`,
      tone: positive ? 'text-emerald-600' : 'text-red-600',
    },
    {
      label: 'Прибыль с занятия',
      value: fmtMoney(result.profitPerLesson),
      sub: `безубыточность при ${fmtMoney(result.breakEvenPricePerLesson)} за занятие`,
      tone: result.profitPerLesson >= 0 ? 'text-emerald-600' : 'text-red-600',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-xs text-gray-500">{k.label}</div>
            <div className={`text-xl font-bold mt-0.5 ${k.tone}`}>{k.value}</div>
            <div className="text-[11px] text-gray-400 mt-1 leading-snug">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowFormula((v) => !v)}
          className="text-xs px-2.5 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
        >
          <Icon name={showFormula ? 'EyeOff' : 'Eye'} size={14} />
          {showFormula ? 'Скрыть формулы' : 'Показать формулы'}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Block
          title="Выручка"
          icon="TrendingUp"
          color="text-emerald-600"
          total={fmtMoney(result.revenue)}
          rows={result.revenueRows}
          showFormula={showFormula}
        />
        <Block
          title="Прямые расходы"
          icon="Users"
          color="text-rose-600"
          total={fmtMoney(result.directTotal)}
          rows={result.directRows}
          showFormula={showFormula}
        />
        <Block
          title={`Косвенные расходы (доля ${(result.indirectShare * 100).toFixed(2)}%)`}
          icon="Building2"
          color="text-violet-600"
          total={fmtMoney(result.indirectTotal)}
          rows={result.indirectRows}
          showFormula={showFormula}
        />
        <Block
          title="Налоги"
          icon="Receipt"
          color="text-amber-600"
          total={fmtMoney(result.taxTotal)}
          rows={result.taxRows}
          showFormula={showFormula}
        />
      </div>

      <div
        className={`rounded-xl border-2 p-5 ${
          positive ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <Icon
            name={positive ? 'CircleCheck' : 'TriangleAlert'}
            size={18}
            className={positive ? 'text-emerald-600' : 'text-red-600'}
          />
          <h3 className="font-semibold text-gray-900">Итог по абонементу за месяц</h3>
        </div>
        <div className="space-y-1.5 text-sm font-mono text-gray-700">
          <div className="flex justify-between">
            <span>Выручка</span>
            <span>{fmtMoney(result.revenue)}</span>
          </div>
          <div className="flex justify-between">
            <span>− Прямые расходы</span>
            <span>−{fmtMoney(result.directTotal)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-300 pt-1.5 font-semibold">
            <span>= Валовая прибыль</span>
            <span>{fmtMoney(result.grossProfit)}</span>
          </div>
          <div className="flex justify-between">
            <span>− Косвенные расходы</span>
            <span>−{fmtMoney(result.indirectTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>− Налог УСН</span>
            <span>−{fmtMoney(result.taxTotal)}</span>
          </div>
          <div
            className={`flex justify-between border-t-2 border-gray-400 pt-1.5 text-base font-bold ${
              positive ? 'text-emerald-700' : 'text-red-700'
            }`}
          >
            <span>= Чистая прибыль</span>
            <span>
              {fmtMoney(result.netProfit)} ({fmtPercent(result.netMarginPercent)})
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
          {positive
            ? `Абонемент окупает себя и вклад в содержание школы. Запас до нуля: ${fmtMoney(
                result.pricePerLesson - result.breakEvenPricePerLesson,
              )} на занятии.`
            : `Абонемент не покрывает расходы. Чтобы выйти в ноль, цена занятия должна быть не ниже ${fmtMoney(
                result.breakEvenPricePerLesson,
              )} — сейчас ${fmtMoney2(result.pricePerLesson)}.`}
        </p>
      </div>
    </div>
  );
}
