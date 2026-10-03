import { useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Slider } from '@/components/ui/slider';
import { SCENARIOS, SCENARIO_LABEL, ScenariosData, SensParam } from '@/lib/finmodelApi';
import { SC_COLOR, SENS_LABEL, fmSensValue, kRub, num, toneCls } from './scenarioUtils';

interface Props {
  data: ScenariosData;
}

const SLIDER: Record<Exclude<SensParam, 'staff'>, { min: number; max: number; step: number }> = {
  price: { min: 12000, max: 18000, step: 500 },
  students: { min: 35, max: 100, step: 1 },
  advertising: { min: 30000, max: 150000, step: 5000 },
};

/** Опорные строки таблицы — как в промте; текущее значение подсвечивается. */
const ROWS: Record<SensParam, (bp: ScenariosData['base_params']) => number[]> = {
  price: (bp) => [Math.round(bp.price * 0.9), bp.price, Math.round(bp.price * 1.1), Math.round(bp.price * 1.2)],
  students: (bp) => [35, bp.students, 50, 60, 70],
  advertising: (bp) => [40000, 50000, bp.advertising, 100000],
  staff: () => [0, 1, 2, 4],
};

const NOTE: Record<SensParam, string> = {
  price: 'Аванс и факт растут вместе с ценой. Уроков столько же, поэтому зарплата педагогов в рублях не меняется — растёт только эквайринг.',
  students: 'Аванс, факт и переменные расходы меняются пропорционально числу учеников: больше учеников — больше уроков и ФОТ.',
  advertising: 'Статья «Реклама» заменяется выбранной суммой во всех месяцах прогноза. Отток учеников из-за меньшей рекламы модель не учитывает.',
  staff: 'Каждый педагог в найм — +60 000 ₽/мес к постоянным (оклад + страховые 30 % + отпускные 12,5 %). Страховые уменьшают налог. Дизайнер-самозанятый — переменный расход, на прибыль не влияет.',
};

const nearest = (values: number[], v: number) => values.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a), values[0]);

const SensBlock = ({ data, param }: { data: ScenariosData; param: SensParam }) => {
  const t = data.sensitivity[param];
  const bp = data.base_params;
  const baseVal = param === 'price' ? bp.price : param === 'students' ? bp.students : param === 'advertising' ? bp.advertising : 0;
  const [val, setVal] = useState(nearest(t.values, baseVal));
  const nz = bp.near_zero;
  const at = (sc: (typeof SCENARIOS)[number], v: number) => t.results[sc][t.values.indexOf(nearest(t.values, v))];
  const rows = Array.from(new Set([...ROWS[param](bp), val].map((v) => nearest(t.values, v)))).sort((a, b) => a - b);
  const chart = t.values.map((v, i) => ({ v, ...Object.fromEntries(SCENARIOS.map((s) => [s, t.results[s][i].net_profit])) }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <h3 className="font-semibold text-gray-900">Чувствительность: {SENS_LABEL[param].toLowerCase()}</h3>
        <span className="text-xs text-gray-400">чистая прибыль за 12 мес</span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {param === 'staff' ? (
          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            {[0, 1, 2, 4].map((n) => (
              <button
                key={n}
                onClick={() => setVal(n)}
                className={`px-3 py-1.5 rounded-md text-sm ${val === n ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-white'}`}
              >
                {n ? `+${n}` : 'Без изменений'}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex-1 min-w-[240px] flex items-center gap-3">
            <span className="text-xs text-gray-400 w-16">{fmSensValue(param, SLIDER[param].min)}</span>
            <Slider
              value={[val]}
              min={SLIDER[param].min}
              max={SLIDER[param].max}
              step={SLIDER[param].step}
              onValueChange={([v]) => setVal(v)}
              className="flex-1"
            />
            <span className="text-xs text-gray-400 w-16 text-right">{fmSensValue(param, SLIDER[param].max)}</span>
          </div>
        )}
        <div className="text-sm font-medium text-gray-900 min-w-[120px]">{fmSensValue(param, val)}</div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {SCENARIOS.map((sc) => {
          const p = at(sc, val);
          const d = p.net_profit - at(sc, baseVal).net_profit;
          return (
            <div key={sc} className="rounded-lg border border-gray-100 p-3">
              <div className="text-xs text-gray-500">{SCENARIO_LABEL[sc]}</div>
              <div className={`text-lg font-semibold inline-block px-1.5 rounded ${toneCls(p.net_profit, nz)}`}>{num(p.net_profit)} ₽</div>
              <div className={`text-xs mt-1 ${d > 0 ? 'text-emerald-600' : d < 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                {d === 0 ? 'как сейчас' : `${d > 0 ? '+' : '−'}${num(Math.abs(d))} ₽ к текущему`}
              </div>
              <div className="text-xs text-gray-400">остаток на конец {num(p.end_balance)} ₽</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b">
                <th className="text-left py-2 font-normal">{SENS_LABEL[param]}</th>
                {SCENARIOS.map((s) => (
                  <th key={s} className="text-right py-2 font-normal">{SCENARIO_LABEL[s]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr
                  key={v}
                  onClick={() => setVal(v)}
                  className={`border-b border-gray-50 cursor-pointer ${v === val ? 'bg-indigo-50/60' : 'hover:bg-gray-50'}`}
                >
                  <td className="py-1.5 text-gray-700">
                    {fmSensValue(param, v)}
                    {v === nearest(t.values, baseVal) && <span className="text-xs text-gray-400"> · сейчас</span>}
                  </td>
                  {SCENARIOS.map((s) => {
                    const np = at(s, v).net_profit;
                    return (
                      <td key={s} className="py-1.5 text-right">
                        <span className={`px-1.5 rounded ${toneCls(np, nz)}`}>{num(np)}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart} margin={{ left: 8, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="v" tickFormatter={(v) => (param === 'students' || param === 'staff' ? String(v) : kRub(v))} fontSize={11} />
              <YAxis tickFormatter={kRub} fontSize={11} width={56} />
              <Tooltip formatter={(v: number) => `${num(v)} ₽`} labelFormatter={(v) => fmSensValue(param, Number(v))} />
              <Legend formatter={(v) => SCENARIO_LABEL[v as (typeof SCENARIOS)[number]]} />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <ReferenceLine x={val} stroke="#6366f1" strokeDasharray="4 4" />
              {SCENARIOS.map((s) => (
                <Line key={s} dataKey={s} stroke={SC_COLOR[s]} dot={false} strokeWidth={2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="text-xs text-gray-400">{NOTE[param]}</p>
    </div>
  );
};

const SensitivityPanel = ({ data }: Props) => (
  <div className="space-y-4">
    {(['price', 'students', 'advertising', 'staff'] as SensParam[]).map((p) => (
      <SensBlock key={p} data={data} param={p} />
    ))}
  </div>
);

export default SensitivityPanel;
