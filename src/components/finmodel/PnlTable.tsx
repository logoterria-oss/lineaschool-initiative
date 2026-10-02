import {
  Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import Icon from '@/components/ui/icon';
import { PnlData, PnlKey, SCENARIOS, SCENARIO_LABEL, Scenario, fmMoney, fmMonthLabel } from '@/lib/finmodelApi';

interface Props {
  data: PnlData;
  active: Scenario;
}

type PnlLine = { key: PnlKey; label: string; kind: 'income' | 'cost' | 'subtotal' | 'total' };

const LINES: PnlLine[] = [
  { key: 'revenue', label: 'Выручка (факт)', kind: 'income' },
  { key: 'variable', label: 'Переменные расходы', kind: 'cost' },
  { key: 'gross_profit', label: 'Валовая прибыль', kind: 'subtotal' },
  { key: 'fixed', label: 'Постоянные расходы', kind: 'cost' },
  { key: 'ano', label: 'Расходы АНО', kind: 'cost' },
  { key: 'one_time', label: 'Разовые расходы', kind: 'cost' },
  { key: 'ebitda', label: 'EBITDA', kind: 'subtotal' },
  { key: 'interest', label: 'Проценты по кредиту', kind: 'cost' },
  { key: 'tax', label: 'Налог', kind: 'cost' },
  { key: 'net_profit', label: 'Чистая прибыль', kind: 'total' },
];

const num = (v: number) => Math.round(v).toLocaleString('ru-RU');
const kRub = (v: number) => `${Math.round(v / 1000)}к`;
const signCls = (v: number) => (v < 0 ? 'text-rose-600' : 'text-emerald-700');

const PnlTable = ({ data, active }: Props) => {
  const rows = data.rows.filter((r) => r.values[active]);
  const annual = data.annual[active];

  const exportCsv = () => {
    const head = ['Статья', ...rows.map((r) => fmMonthLabel(r.month_id)), 'Итого'];
    const lines = LINES.map((l) => [
      l.label,
      ...rows.map((r) => String(Math.round(r.values[active][l.key]))),
      String(Math.round(annual[l.key])),
    ]);
    const summary = [[], ['Итоги по сценариям', ...SCENARIOS.map((s) => SCENARIO_LABEL[s])],
      ...LINES.map((l) => [l.label, ...SCENARIOS.map((s) => String(Math.round(data.annual[s][l.key])))])];
    const csv = [head, ...lines, ...summary].map((r) => r.join(';')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `PnL_${SCENARIO_LABEL[active]}_${rows[0]?.month_id || ''}_${rows[rows.length - 1]?.month_id || ''}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const chart = rows.map((r) => ({
    m: fmMonthLabel(r.month_id),
    revenue: r.values[active].revenue,
    gross: r.values[active].gross_profit,
    ebitda: r.values[active].ebitda,
    net: r.values[active].net_profit,
  }));
  const scenarioChart = rows.map((r) => ({
    m: fmMonthLabel(r.month_id),
    ...Object.fromEntries(SCENARIOS.map((s) => [s, r.values[s]?.net_profit ?? 0])),
  }));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">P&L — отчёт о прибылях и убытках</h2>
            <p className="text-sm text-gray-500 mt-0.5 max-w-3xl">
              По факту оказанных уроков (не по авансам). Тело кредита и выплата собственнику сюда не входят — они только в Cash Flow.
              Проценты по кредиту — по варианту «{data.credit_option === '6m' ? '6 месяцев' : '12 месяцев'}».
            </p>
          </div>
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">
            <Icon name="Download" size={16} /> Выгрузить в Excel
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {([['revenue', 'Выручка за период'], ['gross_profit', 'Валовая прибыль'], ['ebitda', 'EBITDA'], ['net_profit', 'Чистая прибыль']] as [PnlKey, string][]).map(([k, l]) => (
            <div key={k} className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">{l} · {SCENARIO_LABEL[active]}</div>
              <div className={`text-lg font-bold ${k === 'revenue' ? 'text-gray-900' : signCls(annual[k])}`}>{fmMoney(annual[k])}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 font-medium text-gray-900">По месяцам · {SCENARIO_LABEL[active]}</div>
        <div className="overflow-x-auto">
          <table className="text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="sticky left-0 bg-gray-50 text-left px-4 py-2 font-medium min-w-[190px] z-10">Статья</th>
                {rows.map((r) => (
                  <th key={r.month_id} className={`text-right px-3 py-2 font-medium whitespace-nowrap ${r.month_id === data.current_month ? 'text-emerald-700' : ''}`}>
                    {fmMonthLabel(r.month_id)}
                  </th>
                ))}
                <th className="text-right px-4 py-2 font-semibold text-gray-700 whitespace-nowrap bg-gray-100">Итого</th>
              </tr>
            </thead>
            <tbody>
              {LINES.map((l) => {
                const isSub = l.kind === 'subtotal' || l.kind === 'total';
                const rowCls = l.kind === 'total' ? 'bg-emerald-50/60 font-bold' : l.kind === 'subtotal' ? 'bg-gray-50 font-semibold' : '';
                return (
                  <tr key={l.key} className={`border-t border-gray-100 ${rowCls}`}>
                    <td className={`sticky left-0 px-4 py-2 z-10 ${l.kind === 'total' ? 'bg-emerald-50' : isSub ? 'bg-gray-50' : 'bg-white'}`}>
                      {l.kind === 'cost' && <span className="text-gray-400 mr-1">−</span>}
                      {l.label}
                      {l.key === 'variable' && rows[0] && (
                        <span className="text-[11px] text-gray-400 ml-1">{String(rows[0].variable_pct).replace('.', ',')}%</span>
                      )}
                    </td>
                    {rows.map((r) => {
                      const v = r.values[active][l.key];
                      return (
                        <td key={r.month_id} className={`px-3 py-2 text-right tabular-nums whitespace-nowrap ${isSub ? signCls(v) : l.kind === 'cost' ? 'text-gray-600' : ''}`}>
                          {v === 0 && l.kind === 'cost' ? <span className="text-gray-300">0</span> : num(v)}
                          {l.key === 'tax' && r.tax_regime && (
                            <div className="text-[10px] text-gray-400">{r.tax_regime === 'usn' ? 'УСН' : 'патент'}</div>
                          )}
                        </td>
                      );
                    })}
                    <td className={`px-4 py-2 text-right tabular-nums whitespace-nowrap bg-gray-100/70 font-semibold ${isSub ? signCls(annual[l.key]) : ''}`}>
                      {num(annual[l.key])}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="font-medium text-gray-900 mb-3">Выручка и валовая прибыль</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="m" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={kRub} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmMoney(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="revenue" name="Выручка" fill="#c7d2fe" radius={[3, 3, 0, 0]} />
                <Bar dataKey="gross" name="Валовая" fill="#4f46e5" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="font-medium text-gray-900 mb-3">EBITDA и чистая прибыль</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="m" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={kRub} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmMoney(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine y={0} stroke="#9ca3af" />
                <Bar dataKey="ebitda" name="EBITDA" fill="#a7f3d0" radius={[3, 3, 0, 0]} />
                <Line dataKey="net" name="Чистая прибыль" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="font-medium text-gray-900 mb-3">Чистая прибыль по сценариям</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={scenarioChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="m" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={kRub} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmMoney(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine y={0} stroke="#9ca3af" />
                <Line dataKey="min" name={SCENARIO_LABEL.min} stroke="#f43f5e" strokeWidth={2} dot={false} />
                <Line dataKey="base" name={SCENARIO_LABEL.base} stroke="#4f46e5" strokeWidth={2} dot={false} />
                <Line dataKey="opt" name={SCENARIO_LABEL.opt} stroke="#059669" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 font-medium text-gray-900">Итоги за период по сценариям</div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Показатель</th>
                {SCENARIOS.map((s) => (
                  <th key={s} className={`text-right px-4 py-2 font-medium ${s === active ? 'text-emerald-700' : ''}`}>{SCENARIO_LABEL[s]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LINES.map((l) => {
                const isSub = l.kind === 'subtotal' || l.kind === 'total';
                return (
                  <tr key={l.key} className={`border-t border-gray-100 ${l.kind === 'total' ? 'font-bold bg-emerald-50/60' : isSub ? 'font-semibold bg-gray-50' : ''}`}>
                    <td className="px-4 py-1.5">{l.label}</td>
                    {SCENARIOS.map((s) => {
                      const v = data.annual[s][l.key];
                      return (
                        <td key={s} className={`px-4 py-1.5 text-right tabular-nums ${isSub ? signCls(v) : ''}`}>{num(v)}</td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PnlTable;
