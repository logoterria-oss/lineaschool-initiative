import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import Icon from '@/components/ui/icon';
import { UnitFact, fetchUnitFact } from '@/lib/unitMarginApi';
import type { Supervision } from '@/lib/supervisionsApi';
import type { TeacherRate } from '@/lib/teacherRatesApi';
import { weightedRate } from '@/lib/unitTeacherRates';
import {
  UnitMarginInputs, calcAll, calcMonthTotals, fmtMoney, fmtPercent, monthLabel, recentMonths,
} from '@/lib/unitMarginModel';

interface Props {
  /** Текущие ставки и проценты из формы — по ним пересчитываем каждый месяц. */
  inputs: UnitMarginInputs;
  useRealRates: boolean;
  supervisions: Supervision[];
  teacherRates: TeacherRate[];
  onOpenMonth: (m: string) => void;
}

interface Row {
  month: string;
  current: boolean;
  fact: UnitFact;
  indLessons: number;
  grpLessons: number;
  indPrice: number;
  grpPrice: number;
  fill: number;
  indPct: number;
  grpPct: number;
  totalPct: number;
  margin: number;
  revenue: number;
}

const shortMonth = (m: string) => {
  const [y, mm] = m.split('-');
  const names = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  return `${names[Number(mm) - 1]} ${y.slice(2)}`;
};

/**
 * Статистика и динамика маржинальности по месяцам — с сентября 2026, когда
 * начали считать маржинальность урока. Каждый месяц считается тем же способом,
 * что и выбранный: цены и наполняемость — факт CRM месяца, ставки и проценты —
 * текущие из формы (с точными ставками педагогов, если они включены).
 */
export default function UnitStatsCard({ inputs, useRealRates, supervisions, teacherRates, onOpenMonth }: Props) {
  const months = useMemo(() => [...recentMonths(36)].reverse(), []);
  const current = months[months.length - 1];
  const [facts, setFacts] = useState<Record<string, UnitFact>>({});
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    const res = await Promise.allSettled(
      months.map((m) => fetchUnitFact(m, refresh).then((f) => [m, f] as const)),
    );
    const next: Record<string, UnitFact> = {};
    const bad: string[] = [];
    res.forEach((r, i) => {
      if (r.status === 'fulfilled') next[r.value[0]] = r.value[1];
      else bad.push(months[i]);
    });
    setFacts(next);
    setFailed(bad);
    setLoading(false);
  }, [months]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo<Row[]>(() => months.filter((m) => facts[m]).map((m) => {
    const f = facts[m];
    const base: UnitMarginInputs = {
      ...inputs,
      periodMonth: m,
      individual: { ...inputs.individual, price: f.individual.avg_price, groupSize: f.individual.avg_group_size || 1 },
      group: { ...inputs.group, price: f.group.avg_price, groupSize: f.group.avg_group_size || inputs.group.groupSize },
    };
    if (useRealRates) {
      const wi = weightedRate(f.teachers, 'individual', m, supervisions, teacherRates, inputs.individual.rate);
      const wg = weightedRate(f.teachers, 'group', m, supervisions, teacherRates, inputs.group.rate);
      if (wi.lessons > 0) base.individual.rate = wi.rate;
      if (wg.lessons > 0) base.group.rate = wg.rate;
    }
    const res = calcAll(base);
    const t = calcMonthTotals(res, f.individual.lessons, f.group.lessons);
    return {
      month: m,
      current: m === current,
      fact: f,
      indLessons: f.individual.lessons,
      grpLessons: f.group.lessons,
      indPrice: f.individual.avg_price,
      grpPrice: f.group.avg_price,
      fill: f.group.avg_group_size,
      indPct: res.individual.marginPercent,
      grpPct: res.group.marginPercent,
      totalPct: t.marginPercent,
      margin: t.margin,
      revenue: t.revenue,
    };
  }), [months, facts, inputs, useRealRates, supervisions, teacherRates, current]);

  const closed = rows.filter((r) => !r.current);
  const delta = (cur: number, prev?: number, money = false) => {
    if (prev === undefined) return null;
    const d = cur - prev;
    if (Math.abs(d) < (money ? 1 : 0.05)) return <span className="text-gray-400"> · 0</span>;
    const txt = money ? fmtMoney(Math.abs(d)) : `${Math.abs(d).toFixed(1)} п.п.`;
    return <span className={d > 0 ? 'text-emerald-600' : 'text-red-600'}> {d > 0 ? '▲' : '▼'} {txt}</span>;
  };

  const chart = rows.map((r) => ({
    month: shortMonth(r.month) + (r.current ? '*' : ''),
    total: r.totalPct,
    individual: r.indPct,
    group: r.grpPct,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-indigo-200 bg-indigo-50/60 text-indigo-900 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Icon name="TrendingUp" size={17} />
            <h3 className="font-semibold">Статистика и динамика</h3>
          </div>
          <p className="text-xs opacity-70 mt-0.5">
            по месяцам с сентября 2026 · цены и наполняемость — факт CRM, ставки и проценты — текущие
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="text-xs px-2.5 py-1.5 rounded-md border border-indigo-300 bg-white hover:bg-indigo-50 flex items-center gap-1.5 disabled:opacity-50"
        >
          <Icon name={loading ? 'Loader2' : 'RefreshCw'} size={14} className={loading ? 'animate-spin' : ''} />
          Обновить
        </button>
      </div>

      {loading && rows.length === 0 ? (
        <div className="p-10 text-center text-gray-400 text-sm">
          <Icon name="Loader2" size={22} className="animate-spin mx-auto mb-2" />
          Собираем месяцы…
        </div>
      ) : (
        <div className="p-5 space-y-5">
          {closed.length < 2 && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              Закрытых месяцев пока {closed.length}. Динамика к прошлому месяцу появится, когда закроется следующий
              месяц; текущий месяц показан для ориентира, он ещё неполный.
            </div>
          )}

          {chart.length >= 2 && (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chart} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={40} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: number) => fmtPercent(v)} />
                <Legend />
                <Line type="monotone" dataKey="total" name="Все уроки" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="individual" name="Индивидуальные" stroke="#6366f1" strokeWidth={1.5} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="group" name="Групповые" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          )}

          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Месяц</th>
                  <th className="text-right px-3 py-2 font-medium">Инд. уроков</th>
                  <th className="text-right px-3 py-2 font-medium">Груп. уроков</th>
                  <th className="text-right px-3 py-2 font-medium">Цена инд.</th>
                  <th className="text-right px-3 py-2 font-medium">Цена груп. места</th>
                  <th className="text-right px-3 py-2 font-medium">Наполняемость</th>
                  <th className="text-right px-3 py-2 font-medium">Марж. инд.</th>
                  <th className="text-right px-3 py-2 font-medium">Марж. груп.</th>
                  <th className="text-right px-3 py-2 font-medium">Марж. всех</th>
                  <th className="text-right px-4 py-2 font-medium">Маржа, ₽</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r, i) => {
                  const p = i > 0 && !r.current ? rows[i - 1] : undefined;
                  return (
                    <tr
                      key={r.month}
                      onClick={() => onOpenMonth(r.month)}
                      className={`cursor-pointer hover:bg-gray-50 ${r.current ? 'text-gray-400' : ''}`}
                    >
                      <td className="px-4 py-2 font-medium whitespace-nowrap">
                        {monthLabel(r.month)}
                        {r.current && <span className="ml-2 text-xs font-normal">идёт</span>}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.indLessons}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.grpLessons}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(r.indPrice)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(r.grpPrice)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.fill.toFixed(2).replace('.', ',')}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtPercent(r.indPct)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtPercent(r.grpPct)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold whitespace-nowrap">
                        {fmtPercent(r.totalPct)}
                        {p && <span className="text-xs font-normal">{delta(r.totalPct, p.totalPct)}</span>}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums whitespace-nowrap">
                        {fmtMoney(r.margin)}
                        {p && <span className="text-xs">{delta(r.margin, p.margin, true)}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {failed.length > 0 && (
            <div className="text-xs text-amber-700">
              Не удалось получить из CRM: {failed.map(monthLabel).join(', ')}. Нажмите «Обновить».
            </div>
          )}
          <p className="text-xs text-gray-400">Нажмите на месяц, чтобы открыть его подробный расчёт выше.</p>
        </div>
      )}
    </div>
  );
}
