import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import Icon from '@/components/ui/icon';
import { MarginReport } from '@/lib/marginApi';
import { fmtMoney, fmtPercent, monthLabel } from '@/lib/marginModel';

interface Props {
  reports: MarginReport[];
  currentId: number | null;
  onOpen: (r: MarginReport) => void;
  onDelete: (r: MarginReport) => void;
}

const dmy = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const ChartTip = ({ active, payload }: { active?: boolean; payload?: { payload: Record<string, number | string> }[] }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <div className="font-semibold text-gray-900 mb-1">{p.label}</div>
      <div className="text-emerald-600">Выручка: <b>{fmtMoney(Number(p.revenue))}</b></div>
      <div className="text-blue-600">Чистая прибыль: <b>{fmtMoney(Number(p.net))}</b></div>
      <div className="text-violet-600">Маржинальность: <b>{fmtPercent(Number(p.margin))}</b></div>
      <div className="text-gray-500">Рентабельность: <b>{fmtPercent(Number(p.netMargin))}</b></div>
    </div>
  );
};

export default function MarginHistory({ reports, currentId, onOpen, onDelete }: Props) {
  // Динамика строится по одному абонементу: иначе линия скачет между
  // разными тарифами и ничего не показывает.
  const tariffs = useMemo(() => {
    const map = new Map<string, string>();
    reports.forEach((r) => map.set(r.tariff_key, r.tariff_name || r.tariff_key));
    return [...map.entries()];
  }, [reports]);

  const [chartTariff, setChartTariff] = useState('');
  const activeTariff = chartTariff || tariffs[0]?.[0] || '';

  const points = useMemo(
    () =>
      reports
        .filter((r) => r.tariff_key === activeTariff)
        .slice()
        .sort((a, b) => a.period_month.localeCompare(b.period_month))
        .map((r) => ({
          label: monthLabel(r.period_month),
          revenue: r.result?.revenue ?? 0,
          net: r.result?.netProfit ?? 0,
          margin: r.result?.grossMarginPercent ?? 0,
          netMargin: r.result?.netMarginPercent ?? 0,
        })),
    [reports, activeTariff],
  );

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
        Сохранённых отчётов пока нет. Заполните расчёт и нажмите «Сохранить» —
        по сохранениям будет строиться динамика.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {points.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Icon name="LineChart" size={17} className="text-blue-600" />
              <h3 className="font-semibold text-gray-900">Динамика по сохранениям</h3>
            </div>
            <select
              value={activeTariff}
              onChange={(e) => setChartTariff(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white max-w-[380px]"
            >
              {tariffs.map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={points} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                <Line
                  type="monotone" dataKey="revenue" name="Выручка"
                  stroke="#10b981" strokeWidth={2} dot={{ r: 3 }}
                />
                <Line
                  type="monotone" dataKey="net" name="Чистая прибыль"
                  stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Точки — сохранённые отчёты по этому абонементу, по месяцам расчёта.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900 text-sm">
          Сохранённые отчёты · {reports.length}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[880px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs">
                <th className="text-left font-medium px-4 py-2">Название</th>
                <th className="text-left font-medium px-4 py-2">Абонемент</th>
                <th className="text-center font-medium px-4 py-2">Месяц</th>
                <th className="text-right font-medium px-4 py-2">Выручка</th>
                <th className="text-right font-medium px-4 py-2">Прибыль</th>
                <th className="text-center font-medium px-4 py-2" title="Выручка минус прямые расходы, в % от выручки">
                  Маржинальность
                </th>
                <th className="text-center font-medium px-4 py-2" title="Чистая прибыль в % от выручки">
                  Рентаб.
                </th>
                <th className="text-center font-medium px-4 py-2">Изменён</th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const net = r.result?.netProfit ?? 0;
                return (
                  <tr
                    key={r.id}
                    className={`border-t border-gray-100 hover:bg-amber-50/50 ${
                      currentId === r.id ? 'bg-amber-50' : ''
                    }`}
                  >
                    <td className="px-4 py-2 text-gray-900">
                      {r.title || '—'}
                      {r.note && (
                        <div className="text-xs text-gray-400 truncate max-w-[240px]">{r.note}</div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-600 max-w-[240px] truncate" title={r.tariff_name}>
                      {r.tariff_name}
                    </td>
                    <td className="px-4 py-2 text-center text-gray-500">
                      {monthLabel(r.period_month)}
                    </td>
                    <td className="px-4 py-2 text-right">{fmtMoney(r.result?.revenue ?? 0)}</td>
                    <td
                      className={`px-4 py-2 text-right font-semibold ${
                        net >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {fmtMoney(net)}
                    </td>
                    <td className="px-4 py-2 text-center text-violet-600 font-medium">
                      {fmtPercent(r.result?.grossMarginPercent ?? 0)}
                    </td>
                    <td className="px-4 py-2 text-center text-gray-500">
                      {fmtPercent(r.result?.netMarginPercent ?? 0)}
                    </td>
                    <td className="px-4 py-2 text-center text-gray-400 text-xs">
                      {dmy(r.updated_at)}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onOpen(r)}
                          className="p-1.5 text-gray-400 hover:text-amber-600"
                          title="Открыть и редактировать"
                        >
                          <Icon name="Pencil" size={15} />
                        </button>
                        <button
                          onClick={() => onDelete(r)}
                          className="p-1.5 text-gray-300 hover:text-red-500"
                          title="Удалить отчёт"
                        >
                          <Icon name="Trash2" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}