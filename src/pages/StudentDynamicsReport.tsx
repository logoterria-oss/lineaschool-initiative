import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Dot,
} from 'recharts';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/f3a3a4e7-175d-4c13-a586-ff0b3301214d';

type Group = 'week' | 'month' | 'quarter';

interface Point {
  key: string;
  label: string;
  active: number;
  enrolled: number;
  weeks: number;
  estimated: boolean;
  breakdown: Record<string, number>;
}

interface Stats {
  first_label: string;
  last_label: string;
  active_now: number;
  enrolled_now: number;
  active_change: number;
  enrolled_change: number;
  active_max: number;
  active_min: number;
  periods: number;
  weeks_total: number;
}

const GROUP_LABELS: Record<Group, string> = {
  week: 'По неделям',
  month: 'По месяцам',
  quarter: 'По кварталам',
};

/** Быстрые пресеты периода — считаем от сегодняшней даты */
const PRESETS = [
  { id: '3m', label: '3 месяца', months: 3 },
  { id: '6m', label: 'Полгода', months: 6 },
  { id: '12m', label: 'Год', months: 12 },
  { id: 'all', label: 'Всё время', months: 0 },
];

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Точки, восстановленные по занятиям, помечаем полым кружком */
const PointDot = (props: any) => {
  const { cx, cy, payload, stroke } = props;
  if (cx == null || cy == null) return null;
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={3.5}
      fill={payload.estimated ? '#fff' : stroke}
      stroke={stroke}
      strokeWidth={2}
    />
  );
};

const ChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const p: Point = payload[0].payload;
  const breakdown = Object.entries(p.breakdown || {});
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <div className="font-semibold text-gray-900 mb-1">{p.label}</div>
      <div className="text-blue-600">Активных: <b>{p.active}</b></div>
      <div className="text-emerald-600">Действующих: <b>{p.enrolled}</b></div>
      {p.weeks > 1 && (
        <div className="text-xs text-gray-400 mt-1">среднее по {p.weeks} нед.</div>
      )}
      {breakdown.length > 0 && (
        <div className="text-xs text-gray-500 mt-1.5 pt-1.5 border-t border-gray-100">
          {breakdown.map(([k, v]) => (
            <div key={k}>{k}: {v}</div>
          ))}
        </div>
      )}
      {p.estimated && (
        <div className="text-xs text-amber-600 mt-1.5 pt-1.5 border-t border-gray-100">
          Оценка по занятиям
        </div>
      )}
    </div>
  );
};

export default function StudentDynamicsReport() {
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group>('month');
  const [preset, setPreset] = useState('12m');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [customRange, setCustomRange] = useState(false);

  const [points, setPoints] = useState<Point[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Период: либо пресет от сегодня, либо выбранные вручную даты
  const range = useMemo(() => {
    if (customRange) return { from: dateFrom, to: dateTo };
    const p = PRESETS.find((x) => x.id === preset);
    if (!p || p.months === 0) return { from: '', to: '' };
    const to = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - p.months);
    return { from: iso(from), to: iso(to) };
  }, [preset, customRange, dateFrom, dateTo]);

  const query = `group=${group}${range.from ? `&from=${range.from}` : ''}${range.to ? `&to=${range.to}` : ''}`;

  useEffect(() => {
    document.title = 'Динамика количества учеников';
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}?${query}`);
        const data = await res.json();
        setPoints(data.points || []);
        setStats(data.stats || null);

        // Срез за текущую неделю ещё не снят — снимаем его сами при первом
        // открытии отчёта на этой неделе и сразу показываем свежие данные.
        if (data.needs_snapshot) {
          await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'collect' }),
          });
          const fresh = await fetch(`${API_URL}?${query}`);
          const freshData = await fresh.json();
          setPoints(freshData.points || []);
          setStats(freshData.stats || null);
        }
      } catch {
        setError('Не удалось загрузить отчёт. Попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [query]);

  /** Снять свежий срез из CRM вручную, не дожидаясь понедельника */
  const refreshNow = async () => {
    setRefreshing(true);
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'collect' }),
      });
      const res = await fetch(`${API_URL}?${query}`);
      const data = await res.json();
      setPoints(data.points || []);
      setStats(data.stats || null);
    } catch {
      setError('Не удалось обновить данные из CRM.');
    } finally {
      setRefreshing(false);
    }
  };

  const hasEstimated = points.some((p) => p.estimated);

  const changeBadge = (value: number) => {
    if (value > 0) return { color: 'text-green-600', icon: 'TrendingUp' as const, sign: '+' };
    if (value < 0) return { color: 'text-red-600', icon: 'TrendingDown' as const, sign: '' };
    return { color: 'text-gray-500', icon: 'Minus' as const, sign: '' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700 transition-colors">
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Динамика количества учеников
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Срез численности каждую неделю по данным CRM
              </p>
            </div>
          </div>
          <button
            onClick={refreshNow}
            disabled={refreshing}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 disabled:opacity-60 text-gray-700 font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Icon name={refreshing ? 'Loader2' : 'RefreshCw'} size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Обновляю…' : 'Обновить из CRM'}
          </button>
        </div>

        {/* Фильтры */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Детализация</label>
            <div className="grid grid-cols-3 gap-2 max-w-md">
              {(Object.keys(GROUP_LABELS) as Group[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGroup(g)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                    group === g
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                  }`}
                >
                  {GROUP_LABELS[g]}
                </button>
              ))}
            </div>
            {group !== 'week' && (
              <p className="text-xs text-gray-400 mt-1.5">
                Показано среднее значение по всем неделям периода
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Период</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setPreset(p.id); setCustomRange(false); }}
                  className={`py-2 px-4 rounded-lg text-sm font-medium border transition-all ${
                    !customRange && preset === p.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => setCustomRange(true)}
                className={`py-2 px-4 rounded-lg text-sm font-medium border transition-all ${
                  customRange
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                }`}
              >
                Свой период
              </button>
            </div>

            {customRange && (
              <div className="grid grid-cols-2 gap-2 mt-3 max-w-md">
                <div>
                  <span className="block text-xs text-gray-500 mb-1">С</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <span className="block text-xs text-gray-500 mb-1">По</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {loading && <div className="text-gray-500 py-12 text-center">Загрузка отчёта…</div>}

        {error && !loading && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        )}

        {!loading && !error && points.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500">
            За выбранный период данных пока нет.
          </div>
        )}

        {!loading && !error && stats && points.length > 0 && (
          <>
            {/* Сводка */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">Активных сейчас</div>
                <div className="text-2xl font-bold text-blue-600">{stats.active_now}</div>
                <div className="text-xs text-gray-400 mt-0.5">занимаются</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">Действующих сейчас</div>
                <div className="text-2xl font-bold text-emerald-600">{stats.enrolled_now}</div>
                <div className="text-xs text-gray-400 mt-0.5">включая каникулы</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">Изменение активных</div>
                {(() => {
                  const b = changeBadge(stats.active_change);
                  return (
                    <div className={`text-2xl font-bold flex items-center gap-1 ${b.color}`}>
                      <Icon name={b.icon} size={20} />
                      {b.sign}{stats.active_change}
                    </div>
                  );
                })()}
                <div className="text-xs text-gray-400 mt-0.5">за период</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">Максимум активных</div>
                <div className="text-2xl font-bold text-gray-900">{stats.active_max}</div>
                <div className="text-xs text-gray-400 mt-0.5">минимум: {stats.active_min}</div>
              </div>
            </div>

            {/* График */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 mb-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="font-semibold text-gray-900">
                  {GROUP_LABELS[group]} · {stats.first_label} — {stats.last_label}
                </h2>
                <span className="text-xs text-gray-400">точек: {stats.periods}</span>
              </div>
              <div style={{ width: '100%', height: 380 }}>
                <ResponsiveContainer>
                  <LineChart data={points} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      angle={points.length > 10 ? -35 : 0}
                      textAnchor={points.length > 10 ? 'end' : 'middle'}
                      height={points.length > 10 ? 70 : 30}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 13 }} />
                    <Line
                      type="monotone"
                      dataKey="enrolled"
                      name="Действующие"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={<PointDot />}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="active"
                      name="Активные"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={<PointDot />}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Пояснение */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="Info" size={18} className="text-blue-600" />
                <h2 className="font-semibold text-blue-900">Как считали</h2>
              </div>
              <ul className="space-y-2 text-sm text-blue-900/90 list-disc pl-5">
                <li>
                  <b>Активные</b> — ученики со статусом «Активен» в CRM: те, кто сейчас занимается.
                </li>
                <li>
                  <b>Действующие</b> — все, кто числится в школе: активные плюс те, кто на каникулах
                  или в заморозке. Бросившие и завершившие обучение не считаются.
                </li>
                <li>
                  Срез снимается <b>каждый понедельник</b> и сохраняется — так копится история,
                  которой в CRM нет (она хранит только текущий момент).
                </li>
                <li>
                  При выборе месяцев или кварталов показывается <b>среднее</b> значение по всем
                  неделям периода.
                </li>
                {hasEstimated && (
                  <li>
                    Точки с <b>полым кружком</b> восстановлены задним числом по занятиям: активные —
                    у кого на той неделе были уроки. Это близкая оценка, а не точный статус из CRM.
                  </li>
                )}
              </ul>
            </div>

            {/* Таблица */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mt-6">
              <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900 text-sm">
                Данные по периодам
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs">
                      <th className="text-left font-medium px-4 py-2">Период</th>
                      <th className="text-center font-medium px-4 py-2">Активные</th>
                      <th className="text-center font-medium px-4 py-2">Действующие</th>
                      <th className="text-center font-medium px-4 py-2">Недель</th>
                      <th className="text-center font-medium px-4 py-2">Источник</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...points].reverse().map((p) => (
                      <tr key={p.key} className="border-t border-gray-100 hover:bg-gray-50/60">
                        <td className="px-4 py-2 text-gray-900">{p.label}</td>
                        <td className="px-4 py-2 text-center font-semibold text-blue-600">{p.active}</td>
                        <td className="px-4 py-2 text-center font-medium text-emerald-600">{p.enrolled}</td>
                        <td className="px-4 py-2 text-center text-gray-400">{p.weeks}</td>
                        <td className="px-4 py-2 text-center">
                          {p.estimated ? (
                            <span className="text-[10px] uppercase tracking-wide bg-amber-100 text-amber-700 rounded px-1.5 py-0.5">
                              оценка
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase tracking-wide bg-green-100 text-green-700 rounded px-1.5 py-0.5">
                              CRM
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}