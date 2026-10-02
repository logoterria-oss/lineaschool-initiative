import { useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import Icon from '@/components/ui/icon';
import { PayoutData, PayoutRow, SCENARIOS, SCENARIO_LABEL, Scenario, fmMoney, fmMonthLabel } from '@/lib/finmodelApi';

interface Props {
  data: PayoutData;
  active: Scenario;
  onSave: (month: string, v: { payout_pct?: number | null; payout_manual?: number | null }) => Promise<void>;
}

const toNum = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.'));
const kRub = (v: number) => `${Math.round(v / 1000)}к`;

function InlineEdit({ value, suffix, onSave, onReset, width = 'w-20' }: {
  value: string;
  suffix: string;
  onSave: (v: number) => Promise<void>;
  onReset?: () => Promise<void>;
  width?: string;
}) {
  const [v, setV] = useState(value);
  const [busy, setBusy] = useState(false);
  const bad = v.trim() === '' || Number.isNaN(toNum(v)) || toNum(v) < 0;
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex items-center justify-end gap-1">
      <input
        autoFocus
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !bad && run(() => onSave(toNum(v)))}
        className={`${width} px-1.5 py-0.5 border border-gray-300 rounded text-right text-sm`}
      />
      <span className="text-gray-400 text-xs">{suffix}</span>
      <button disabled={bad || busy} onClick={() => run(() => onSave(toNum(v)))} className="text-emerald-600 disabled:opacity-40" title="Сохранить">
        <Icon name={busy ? 'Loader2' : 'Check'} size={15} className={busy ? 'animate-spin' : ''} />
      </button>
      {onReset && (
        <button disabled={busy} onClick={() => run(onReset)} className="text-gray-400 hover:text-red-600" title="Убрать ручное значение">
          <Icon name="RotateCcw" size={13} />
        </button>
      )}
    </div>
  );
}

const PayoutsTable = ({ data, active, onSave }: Props) => {
  const [edit, setEdit] = useState<string | null>(null);
  const sum = data.summary[active];
  const target = data.target_monthly;
  const chart = data.rows.map((r) => ({ m: fmMonthLabel(r.month_id), payout: r.values[active]?.payout_final || 0 }));

  const save = (month: string, v: Parameters<Props['onSave']>[1]) => async () => {
    await onSave(month, v);
    setEdit(null);
  };

  const pctCell = (r: PayoutRow) => {
    const key = `pct|${r.month_id}`;
    if (edit === key) {
      return (
        <InlineEdit
          value={String(r.payout_pct).replace('.', ',')}
          suffix="%"
          width="w-14"
          onSave={(v) => save(r.month_id, { payout_pct: v })()}
          onReset={r.pct_source === 'manual' ? save(r.month_id, { payout_pct: null }) : undefined}
        />
      );
    }
    return (
      <button onClick={() => setEdit(key)} className="group inline-flex items-center gap-1 hover:text-emerald-700">
        {String(r.payout_pct).replace('.', ',')}%
        {r.pct_source === 'manual' && <span className="text-[10px] text-amber-600">вручную</span>}
        <Icon name="Pencil" size={10} className="text-gray-300 group-hover:text-emerald-600" />
      </button>
    );
  };

  const manualCell = (r: PayoutRow) => {
    const key = `man|${r.month_id}`;
    if (edit === key) {
      return (
        <InlineEdit
          value={String(r.payout_manual ?? r.values[active]?.payout_amount ?? 0)}
          suffix="₽"
          width="w-24"
          onSave={(v) => save(r.month_id, { payout_manual: v })()}
          onReset={r.payout_manual != null ? save(r.month_id, { payout_manual: null }) : undefined}
        />
      );
    }
    return (
      <button onClick={() => setEdit(key)} className="group inline-flex items-center gap-1 hover:text-emerald-700">
        {r.payout_manual != null ? <span className="text-amber-700">{fmMoney(r.payout_manual)}</span> : <span className="text-gray-300">—</span>}
        <Icon name="Pencil" size={10} className="text-gray-300 group-hover:text-emerald-600" />
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-lg font-semibold text-gray-900">Выплата собственнику</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {data.default_pct}% от поступлений (аванс − эквайринг {String(data.acquiring_pct).replace('.', ',')}%). Ручная сумма важнее процента.
          Это отток денег в Cash Flow, но не расход в P&L и не уменьшает налоги — собственник забирает прибыль, а не получает зарплату.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-xs text-gray-500">За {data.rows.length} мес · {SCENARIO_LABEL[active]}</div>
            <div className="text-lg font-bold text-emerald-700">{fmMoney(sum?.payout)}</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-xs text-gray-500">В среднем в месяц</div>
            <div className="text-lg font-bold text-gray-900">{fmMoney(sum?.avg)}</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-xs text-gray-500">Максимум</div>
            <div className="text-lg font-bold text-gray-900">{fmMoney(sum?.max.amount)}</div>
            <div className="text-[11px] text-gray-400">{sum && fmMonthLabel(sum.max.month_id)}</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-xs text-gray-500">Минимум</div>
            <div className="text-lg font-bold text-gray-900">{fmMoney(sum?.min.amount)}</div>
            <div className="text-[11px] text-gray-400">{sum && fmMonthLabel(sum.min.month_id)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="font-medium text-gray-900">По месяцам · {SCENARIO_LABEL[active]}</div>
          <div className="text-xs text-gray-500">Процент и ручная сумма задаются на месяц и действуют во всех сценариях</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Месяц</th>
                <th className="text-right px-4 py-2 font-medium">Аванс</th>
                <th className="text-right px-4 py-2 font-medium">Поступления</th>
                <th className="text-right px-4 py-2 font-medium">Процент</th>
                <th className="text-right px-4 py-2 font-medium">Выплата</th>
                <th className="text-right px-4 py-2 font-medium">Ручная</th>
                <th className="text-right px-4 py-2 font-medium">Итог</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => {
                const v = r.values[active];
                if (!v) return null;
                return (
                  <tr key={r.month_id} className={`border-t border-gray-100 ${r.month_id === data.current_month ? 'bg-emerald-50/50' : ''}`}>
                    <td className="px-4 py-2 whitespace-nowrap">{fmMonthLabel(r.month_id)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-gray-500">{fmMoney(v.avans)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmMoney(v.revenue)}</td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">{pctCell(r)}</td>
                    <td className={`px-4 py-2 text-right tabular-nums ${r.payout_manual != null ? 'text-gray-400 line-through' : ''}`}>{fmMoney(v.payout_amount)}</td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">{manualCell(r)}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-semibold">{fmMoney(v.payout_final)}</td>
                  </tr>
                );
              })}
            </tbody>
            {sum && (
              <tfoot className="bg-gray-50 font-semibold">
                <tr className="border-t border-gray-200">
                  <td className="px-4 py-2">Итого</td>
                  <td className="px-4 py-2 text-right tabular-nums text-gray-500">{fmMoney(sum.avans)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{fmMoney(sum.revenue)}</td>
                  <td colSpan={3} />
                  <td className="px-4 py-2 text-right tabular-nums">{fmMoney(sum.payout)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="font-medium text-gray-900 mb-3">Выплаты по месяцам и цель {fmMoney(target)}/мес</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="m" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={kRub} tick={{ fontSize: 11 }} domain={[0, Math.max(target * 1.1, ...chart.map((c) => c.payout))]} />
              <Tooltip formatter={(v: number) => fmMoney(v)} />
              <ReferenceLine y={target} stroke="#e11d48" strokeDasharray="5 5" label={{ value: 'Цель', fontSize: 11, fill: '#e11d48', position: 'insideTopRight' }} />
              <Bar dataKey="payout" name="Выплата" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 font-medium text-gray-900">Итого по сценариям</div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Сценарий</th>
                <th className="text-right px-4 py-2 font-medium">Поступления</th>
                <th className="text-right px-4 py-2 font-medium">Выплата</th>
                <th className="text-right px-4 py-2 font-medium">В месяц</th>
              </tr>
            </thead>
            <tbody>
              {SCENARIOS.map((sc) => {
                const s = data.summary[sc];
                if (!s) return null;
                return (
                  <tr key={sc} className={`border-t border-gray-100 ${sc === active ? 'bg-emerald-50/60 font-medium' : ''}`}>
                    <td className="px-4 py-2">{SCENARIO_LABEL[sc]}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmMoney(s.revenue)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmMoney(s.payout)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmMoney(s.avg)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {sum && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 text-sm">
            <div className="font-medium text-rose-900">Цель {fmMoney(target)}/мес vs что получается</div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <div className="text-xs text-rose-700/70">Средняя выплата</div>
                <div className="text-lg font-bold text-gray-900">{fmMoney(sum.avg)}</div>
              </div>
              <div>
                <div className="text-xs text-rose-700/70">Разрыв в месяц</div>
                <div className="text-lg font-bold text-rose-700">{sum.gap_monthly < 0 ? '−' : '+'}{fmMoney(Math.abs(sum.gap_monthly))}</div>
              </div>
              <div>
                <div className="text-xs text-rose-700/70">Цель за {data.rows.length} мес</div>
                <div className="font-semibold text-gray-900">{fmMoney(target * data.rows.length)}</div>
              </div>
              <div>
                <div className="text-xs text-rose-700/70">Разрыв за период</div>
                <div className="font-semibold text-rose-700">{sum.gap_year < 0 ? '−' : '+'}{fmMoney(Math.abs(sum.gap_year))}</div>
              </div>
            </div>
            <div className="mt-4 text-rose-900/80 leading-relaxed">
              Чтобы выйти на цель, нужно одно из: поступления ~{fmMoney(sum.revenue_needed_monthly)}/мес при {data.default_pct}%,
              или процент выплаты ~{String(sum.pct_needed ?? '—').replace('.', ',')}% при текущих поступлениях,
              или сокращение постоянных расходов и кредита. Это не приговор, а точка отсчёта для плана.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayoutsTable;
