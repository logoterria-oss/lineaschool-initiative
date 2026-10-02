import { useState } from 'react';
import {
  Area, CartesianGrid, ComposedChart, Legend, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import Icon from '@/components/ui/icon';
import {
  CashflowData, CfValues, CreditOption, SCENARIOS, SCENARIO_LABEL, Scenario, fmMoney, fmMonthLabel,
} from '@/lib/finmodelApi';

interface Props {
  data: CashflowData;
  active: Scenario;
  onCreditOption: (o: CreditOption) => Promise<void>;
  onPayoutPct: (month: string, pct: number | null) => Promise<void>;
}

type CfKey = keyof CfValues;
type CfLine = { key: CfKey; label: string; kind: 'balance' | 'in' | 'out' | 'net' | 'end' };

const LINES: CfLine[] = [
  { key: 'start_balance', label: 'Остаток на начало', kind: 'balance' },
  { key: 'revenue', label: 'Поступления', kind: 'in' },
  { key: 'variable', label: 'Переменные расходы', kind: 'out' },
  { key: 'fixed', label: 'Постоянные расходы', kind: 'out' },
  { key: 'ano', label: 'Расходы АНО', kind: 'out' },
  { key: 'one_time', label: 'Разовые расходы', kind: 'out' },
  { key: 'tax', label: 'Налог', kind: 'out' },
  { key: 'interest', label: 'Кредит: проценты', kind: 'out' },
  { key: 'body', label: 'Кредит: тело', kind: 'out' },
  { key: 'payout', label: 'Выплата собственнику', kind: 'out' },
  { key: 'net_flow', label: 'Чистый поток', kind: 'net' },
  { key: 'end_balance', label: 'Остаток на конец', kind: 'end' },
];

const SC_COLOR: Record<Scenario, string> = { min: '#f43f5e', base: '#4f46e5', opt: '#059669' };
const num = (v: number) => Math.round(v).toLocaleString('ru-RU');
const kRub = (v: number) => `${Math.round(v / 1000)}к`;
const signCls = (v: number) => (v < 0 ? 'text-rose-600' : 'text-emerald-700');

const CashflowTable = ({ data, active, onCreditOption, onPayoutPct }: Props) => {
  const [busy, setBusy] = useState<string | null>(null);
  const rows = data.rows.filter((r) => r.values[active]);
  const sum = data.summary[active];

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  const chart = rows.map((r) => ({
    m: fmMonthLabel(r.month_id),
    ...Object.fromEntries(SCENARIOS.map((s) => [s, r.values[s]?.end_balance ?? null])),
    activeNeg: Math.min(0, r.values[active].end_balance),
  }));
  const minY = Math.min(0, ...SCENARIOS.flatMap((s) => rows.map((r) => r.values[s]?.end_balance ?? 0)));

  const exportCsv = () => {
    const head = ['Строка', ...rows.map((r) => fmMonthLabel(r.month_id)), 'Итого'];
    const body = LINES.map((l) => [
      l.label,
      ...rows.map((r) => String(Math.round(r.values[active][l.key]))),
      l.kind === 'balance' ? '' : l.kind === 'end' ? String(Math.round(sum.end_balance)) : String(Math.round(sum[l.key as keyof typeof sum] as number)),
    ]);
    const csv = [head, ...body].map((r) => r.join(';')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `CashFlow_${SCENARIO_LABEL[active]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const gapRows = rows.filter((r) => r.values[active].end_balance < 0);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Cash Flow — движение денег</h2>
            <p className="text-sm text-gray-500 mt-0.5 max-w-3xl">
              Поступления — авансы минус эквайринг (не факт). Кредит — проценты и тело, выплата собственнику — отток.
              Стартовый остаток {fmMoney(data.start_balance.total)} (Т-Банк {fmMoney(data.start_balance.tbank)} + Локо-Банк{' '}
              {fmMoney(data.start_balance.lokobank)}) на {data.start_balance.date ? new Date(data.start_balance.date).toLocaleDateString('ru-RU') : '01.10.2026'}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden text-sm">
              {(['6m', '12m'] as CreditOption[]).map((o) => (
                <button
                  key={o}
                  disabled={busy !== null}
                  onClick={() => o !== data.credit_option && run('credit', () => onCreditOption(o))}
                  className={`px-3 py-2 ${data.credit_option === o ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  Кредит {o === '6m' ? '6' : '12'} мес
                </button>
              ))}
            </div>
            <button onClick={exportCsv} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">
              <Icon name="Download" size={16} /> Excel
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-xs text-gray-500">Остаток на конец периода</div>
            <div className={`text-lg font-bold ${signCls(sum.end_balance)}`}>{fmMoney(sum.end_balance)}</div>
            <div className="text-[11px] text-gray-400">{rows.length && fmMonthLabel(rows[rows.length - 1].month_id)}</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-xs text-gray-500">Дно (минимальный остаток)</div>
            <div className={`text-lg font-bold ${signCls(sum.min_balance ?? 0)}`}>{fmMoney(sum.min_balance ?? 0)}</div>
            <div className="text-[11px] text-gray-400">{sum.min_month && fmMonthLabel(sum.min_month)}</div>
          </div>
          <div className={`rounded-lg p-3 ${sum.first_gap_month ? 'bg-rose-50' : 'bg-emerald-50'}`}>
            <div className="text-xs text-gray-500">Кассовый разрыв</div>
            {sum.first_gap_month ? (
              <>
                <div className="text-lg font-bold text-rose-700">с {fmMonthLabel(sum.first_gap_month)}</div>
                <div className="text-[11px] text-rose-600">{sum.gap_months.length} мес в минусе</div>
              </>
            ) : (
              <div className="text-lg font-bold text-emerald-700">нет</div>
            )}
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-xs text-gray-500">Все оттоки за период</div>
            <div className="text-lg font-bold text-gray-900">{fmMoney(sum.total_outflow)}</div>
            <div className="text-[11px] text-gray-400">поступления {fmMoney(sum.revenue)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="font-medium text-gray-900 mb-3">Накопленный остаток по сценариям</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="m" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={kRub} tick={{ fontSize: 11 }} />
              {minY < 0 && <ReferenceArea y1={minY} y2={0} fill="#fee2e2" fillOpacity={0.5} />}
              <ReferenceLine y={0} stroke="#e11d48" strokeDasharray="4 4" />
              <Tooltip formatter={(v: number, n: string) => (n === 'activeNeg' ? null : fmMoney(v))} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area dataKey="activeNeg" legendType="none" stroke="none" fill="#f43f5e" fillOpacity={0.25} />
              {SCENARIOS.map((s) => (
                <Line
                  key={s}
                  dataKey={s}
                  name={SCENARIO_LABEL[s]}
                  stroke={SC_COLOR[s]}
                  strokeWidth={s === active ? 3 : 1.5}
                  strokeDasharray={s === active ? undefined : '5 4'}
                  dot={s === active ? { r: 3 } : false}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 font-medium text-gray-900">По месяцам · {SCENARIO_LABEL[active]}</div>
        <div className="overflow-x-auto">
          <table className="text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="sticky left-0 bg-gray-50 text-left px-4 py-2 font-medium min-w-[200px] z-10">Строка</th>
                {rows.map((r) => (
                  <th key={r.month_id} className={`text-right px-3 py-2 font-medium whitespace-nowrap ${r.month_id === data.current_month ? 'text-emerald-700' : ''}`}>
                    {fmMonthLabel(r.month_id)}
                  </th>
                ))}
                <th className="text-right px-4 py-2 font-semibold text-gray-700 bg-gray-100">Итого</th>
              </tr>
            </thead>
            <tbody>
              {LINES.map((l) => {
                const strong = l.kind === 'net' || l.kind === 'end' || l.kind === 'balance';
                const rowBg = l.kind === 'end' ? 'bg-indigo-50/60 font-bold' : l.kind === 'net' ? 'bg-gray-50 font-semibold' : l.kind === 'balance' ? 'text-gray-500' : '';
                const stickyBg = l.kind === 'end' ? 'bg-indigo-50' : l.kind === 'net' ? 'bg-gray-50' : 'bg-white';
                const total = l.kind === 'balance' ? null : l.kind === 'end' ? sum.end_balance : (sum[l.key as keyof typeof sum] as number);
                return (
                  <tr key={l.key} className={`border-t border-gray-100 ${rowBg}`}>
                    <td className={`sticky left-0 px-4 py-2 z-10 ${stickyBg}`}>
                      {l.kind === 'out' && <span className="text-gray-400 mr-1">−</span>}
                      {l.kind === 'in' && <span className="text-emerald-500 mr-1">+</span>}
                      {l.label}
                    </td>
                    {rows.map((r) => {
                      const v = r.values[active][l.key];
                      const neg = l.kind === 'end' && v < 0;
                      return (
                        <td key={r.month_id} className={`px-3 py-2 text-right tabular-nums whitespace-nowrap ${neg ? 'bg-rose-100' : ''} ${strong && l.kind !== 'balance' ? signCls(v) : l.kind === 'out' ? 'text-gray-600' : ''}`}>
                          {v === 0 && l.kind === 'out' ? <span className="text-gray-300">0</span> : num(v)}
                          {l.key === 'tax' && r.tax_regime && <div className="text-[10px] text-gray-400">{r.tax_regime === 'usn' ? 'УСН' : 'патент'}</div>}
                        </td>
                      );
                    })}
                    <td className={`px-4 py-2 text-right tabular-nums bg-gray-100/70 font-semibold ${total !== null && strong ? signCls(total) : ''}`}>
                      {total === null ? '' : num(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 font-medium text-gray-900">Итоги по сценариям</div>
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
              {LINES.filter((l) => l.kind !== 'balance').map((l) => (
                <tr key={l.key} className={`border-t border-gray-100 ${l.kind === 'end' ? 'font-bold bg-indigo-50/60' : l.kind === 'net' ? 'font-semibold bg-gray-50' : ''}`}>
                  <td className="px-4 py-1.5">{l.label}</td>
                  {SCENARIOS.map((s) => {
                    const v = l.kind === 'end' ? data.summary[s].end_balance : (data.summary[s][l.key as keyof typeof sum] as number);
                    return <td key={s} className={`px-4 py-1.5 text-right tabular-nums ${l.kind === 'net' || l.kind === 'end' ? signCls(v) : ''}`}>{num(v)}</td>;
                  })}
                </tr>
              ))}
              <tr className="border-t border-gray-100 text-gray-600">
                <td className="px-4 py-1.5">Дно остатка</td>
                {SCENARIOS.map((s) => (
                  <td key={s} className={`px-4 py-1.5 text-right tabular-nums ${signCls(data.summary[s].min_balance ?? 0)}`}>
                    {num(data.summary[s].min_balance ?? 0)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className={`rounded-xl border p-5 text-sm ${gapRows.length ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
          {gapRows.length ? (
            <>
              <div className="font-medium text-rose-900 flex items-center gap-2">
                <Icon name="TriangleAlert" size={16} /> Кассовый разрыв: {gapRows.length} мес в минусе
              </div>
              <div className="text-rose-900/80 mt-1">
                Дно — {fmMoney(sum.min_balance ?? 0)} в {sum.min_month && fmMonthLabel(sum.min_month)}. Что можно сделать:
              </div>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-rose-900/80">
                <li>снизить выплату собственнику в месяцы разрыва;</li>
                <li>{data.credit_option === '6m' ? 'растянуть кредит на 12 месяцев — платёж ниже;' : 'кредит уже растянут на 12 месяцев;'}</li>
                <li>копить резерв в сильные месяцы (декабрь–март);</li>
                <li>поднять летние авансы — акции и скидки за предоплату;</li>
                <li>сократить постоянные расходы летом (реклама, нейронка).</li>
              </ul>
              <div className="mt-4 font-medium text-rose-900">Быстро обнулить выплату в месяцы разрыва:</div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {gapRows.map((r) => (
                  <button
                    key={r.month_id}
                    disabled={busy !== null}
                    onClick={() => run(r.month_id, () => onPayoutPct(r.month_id, r.values[active].payout > 0 ? 0 : null))}
                    className={`text-xs px-2.5 py-1 rounded-md border ${r.values[active].payout > 0 ? 'bg-white border-rose-200 text-rose-700 hover:bg-rose-100' : 'bg-rose-200 border-rose-300 text-rose-900'}`}
                    title={r.values[active].payout > 0 ? 'Поставить 0%' : 'Вернуть процент по умолчанию'}
                  >
                    {busy === r.month_id ? <Icon name="Loader2" size={12} className="animate-spin inline" /> : fmMonthLabel(r.month_id)}
                    {r.values[active].payout > 0 ? ` · −${kRub(r.values[active].payout)}` : ' · 0%'}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-rose-700/70 mt-2">Точная настройка процента — на вкладке «Выплата собственнику».</div>
            </>
          ) : (
            <div className="font-medium text-emerald-900 flex items-center gap-2">
              <Icon name="CircleCheck" size={16} /> Кассового разрыва нет — остаток не уходит в минус
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashflowTable;
