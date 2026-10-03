import { useState } from 'react';
import {
  Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart, ReferenceArea, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { DashboardData, SCENARIOS, SCENARIO_LABEL, Scenario, fmMoney, fmMonthLabel } from '@/lib/finmodelApi';
import { EXPENSE_LABEL } from './dashboardUtils';

interface Props {
  data: DashboardData;
  active: Scenario;
}

const SC_COLOR: Record<Scenario, string> = { min: '#f43f5e', base: '#4f46e5', opt: '#059669' };
const EXP_COLORS = ['#6366f1', '#0ea5e9', '#a855f7', '#f59e0b', '#ef4444', '#f97316', '#64748b', '#10b981'];
const kRub = (v: number) => `${Math.round(v / 1000).toLocaleString('ru-RU')}к`;
const money = (v: number) => fmMoney(v);

const Card = ({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 ${className}`}>
    <div className="text-sm font-medium text-gray-900 mb-2">{title}</div>
    <div className="h-60">{children}</div>
  </div>
);

type ScMetric = 'net_profit' | 'end_balance' | 'avans' | 'ebitda';
const SC_METRIC_LABEL: Record<ScMetric, string> = {
  net_profit: 'Чистая прибыль', end_balance: 'Остаток', avans: 'Авансы', ebitda: 'EBITDA',
};

const DashboardCharts = ({ data, active }: Props) => {
  const [scMetric, setScMetric] = useState<ScMetric>('end_balance');
  const rows = data.series.map((p) => ({ m: fmMonthLabel(p.month_id), ...p[active] }));
  const minBal = Math.min(0, ...rows.map((r) => r.end_balance ?? 0));
  const exp = data.expenses.filter((e) => e.value > 0).sort((a, b) => b.value - a.value)
    .map((e) => ({ name: EXPENSE_LABEL[e.key] || e.key, value: e.value }));
  const scRows = data.series.map((p) => ({ m: fmMonthLabel(p.month_id), ...Object.fromEntries(SCENARIOS.map((s) => [s, p[s][scMetric]])) }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <Card title="Авансы vs Факт">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ left: 4, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="m" fontSize={10} />
            <YAxis tickFormatter={kRub} fontSize={10} width={48} />
            <Tooltip formatter={money} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line dataKey="avans" name="Авансы" stroke="#10b981" strokeWidth={2} dot={false} />
            <Line dataKey="fact" name="Факт" stroke="#6366f1" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Маржинальная прибыль по месяцам">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ left: 4, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="m" fontSize={10} />
            <YAxis tickFormatter={kRub} fontSize={10} width={48} />
            <Tooltip formatter={money} />
            <Bar dataKey="margin" name="Маржа" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Cash Flow накопительно">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows.map((r) => ({ ...r, neg: Math.min(0, r.end_balance ?? 0) }))} margin={{ left: 4, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="m" fontSize={10} />
            <YAxis tickFormatter={kRub} fontSize={10} width={48} />
            {minBal < 0 && <ReferenceArea y1={minBal} y2={0} fill="#fee2e2" fillOpacity={0.6} />}
            <ReferenceLine y={0} stroke="#e11d48" strokeDasharray="4 4" />
            <Tooltip formatter={(v: number, n: string) => (n === 'neg' ? null : money(v))} />
            <Area dataKey="neg" legendType="none" stroke="none" fill="#f43f5e" fillOpacity={0.25} />
            <Line dataKey="end_balance" name="Остаток" stroke="#4f46e5" strokeWidth={2} dot={{ r: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Расходы по категориям (12 мес)">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={exp} layout="vertical" margin={{ left: 8, right: 16, top: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tickFormatter={kRub} fontSize={10} />
            <YAxis type="category" dataKey="name" fontSize={10} width={120} />
            <Tooltip formatter={money} />
            <Bar dataKey="value" name="Сумма" radius={[0, 3, 3, 0]}>
              {exp.map((_, i) => <Cell key={i} fill={EXP_COLORS[i % EXP_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="P&L по месяцам">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ left: 4, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="m" fontSize={10} />
            <YAxis tickFormatter={kRub} fontSize={10} width={48} />
            <Tooltip formatter={money} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Bar dataKey="revenue_pnl" name="Выручка" fill="#c7d2fe" />
            <Bar dataKey="gross_profit" name="Валовая" fill="#818cf8" />
            <Bar dataKey="ebitda" name="EBITDA" fill="#4f46e5" />
            <Bar dataKey="net_profit" name="Чистая" fill="#059669" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="text-sm font-medium text-gray-900">Сценарии</div>
          <select value={scMetric} onChange={(e) => setScMetric(e.target.value as ScMetric)} className="text-xs border border-gray-200 rounded-md px-2 py-1">
            {(Object.keys(SC_METRIC_LABEL) as ScMetric[]).map((m) => <option key={m} value={m}>{SC_METRIC_LABEL[m]}</option>)}
          </select>
        </div>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={scRows} margin={{ left: 4, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="m" fontSize={10} />
              <YAxis tickFormatter={kRub} fontSize={10} width={48} />
              <Tooltip formatter={money} />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => SCENARIO_LABEL[v as Scenario]} />
              <ReferenceLine y={0} stroke="#94a3b8" />
              {SCENARIOS.map((s) => (
                <Line key={s} dataKey={s} stroke={SC_COLOR[s]} strokeWidth={s === active ? 3 : 1.5} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
