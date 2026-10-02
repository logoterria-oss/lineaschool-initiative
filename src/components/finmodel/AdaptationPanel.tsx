import { useState } from 'react';
import {
  Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import Icon from '@/components/ui/icon';
import {
  ADAPT_METRIC_LABEL, AdaptationData, AdaptLogRow, adaptNewItem, adaptSetBase, cancelAdaptation,
  fmMoney, fmMonthLabel, fmPct, setAdaptParams,
} from '@/lib/finmodelApi';

interface Props {
  data: AdaptationData;
  onChanged: () => Promise<void>;
}

const K_PRESETS: [number, string][] = [
  [0, 'нет адаптации'],
  [0.3, 'осторожно'],
  [0.5, 'сбалансированно'],
  [0.7, 'быстро'],
  [1, 'прогноз = факт'],
];

const num = (v: number, d = 2) => Number(v).toFixed(d).replace('.', ',');
const signed = (v: number, fmt: (x: number) => string) => (v > 0 ? `+${fmt(v)}` : v < 0 ? `−${fmt(-v)}` : fmt(0));
const kRub = (v: number) => `${Math.round(v / 1000)}к`;

function fmtValue(row: Pick<AdaptLogRow, 'metric'>, v: number) {
  return row.metric === 'variable_pct' ? fmPct(v) : fmMoney(v);
}

function fmtDelta(row: Pick<AdaptLogRow, 'metric'>, v: number) {
  return row.metric === 'variable_pct'
    ? signed(Number(v), (x) => `${num(x)} п.п.`)
    : signed(Number(v), (x) => fmMoney(x));
}

const STATUS: Record<AdaptLogRow['status'], { label: string; cls: string }> = {
  applied: { label: 'применена', cls: 'bg-emerald-50 text-emerald-700' },
  skipped: { label: 'ниже порога', cls: 'bg-gray-100 text-gray-500' },
  cancelled: { label: 'отменена', cls: 'bg-rose-50 text-rose-600' },
};

export default function AdaptationPanel({ data, onChanged }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [kInput, setKInput] = useState(String(data.params.k).replace('.', ','));
  const [reapply, setReapply] = useState(false);
  const [chart, setChart] = useState<'avans' | 'fact' | 'variable_pct'>('avans');
  const [showSkipped, setShowSkipped] = useState(true);
  const [newItem, setNewItem] = useState({ mode: 'designers', name: '', amount: '', month: data.current_month });

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setErr('');
    try {
      await fn();
      await onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  const saveK = (k: number) => run(() => setAdaptParams({ k, reapply }));
  const kParsed = Number(kInput.replace(',', '.'));
  const log = showSkipped ? data.log : data.log.filter((l) => l.status !== 'skipped');

  const isPct = chart === 'variable_pct';
  const points = data.series[chart].map((p) => ({
    month: fmMonthLabel(p.month_id),
    forecast: p.forecast ?? null,
    actual: p.actual ?? null,
    model: p.model ?? null,
    corrected: p.corrected ?? null,
    dev: p.deviation_pct ?? null,
  }));
  const firstFuture = points.find((p) => p.model != null)?.month;
  const fmtAxis = isPct ? (v: number) => `${num(v, 1)}%` : kRub;
  const fmtTip = (v: number) => (isPct ? fmPct(v) : fmMoney(v));

  const manualItems = data.items;

  return (
    <div className="space-y-4">
      {/* Параметры */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-1 min-w-[260px]">
            <h3 className="font-semibold text-gray-900">Адаптивное прогнозирование</h3>
            <p className="text-xs text-gray-500 mt-1">
              1-го числа месяц закрывается: факт сравнивается с прогнозом, который модель давала заранее, и будущие
              прогнозы сдвигаются на <b>(факт − прогноз) × K</b>. История не пересчитывается. Адаптируются авансы, факт,
              переменный %, ручные постоянные статьи (только при отклонении {data.params.systematic_months} мес подряд)
              и новые статьи. Кредит, налоги, АНО и выплата собственнику не адаптируются.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Порог: отклонение меньше {num(data.params.min_deviation_pct, 0)}% (для переменного % — меньше{' '}
              {num(data.params.min_deviation_pp, 1)} п.п.) не корректируем. Уведомление — при отклонении больше{' '}
              {num(data.params.alert_pct, 0)}%.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Коэффициент K</div>
            <div className="text-3xl font-bold text-violet-700">{num(data.params.k)}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {K_PRESETS.map(([k, label]) => (
            <button
              key={k}
              disabled={busy}
              onClick={() => {
                setKInput(String(k).replace('.', ','));
                saveK(k);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                data.params.k === k ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {num(k, 1)} <span className="text-xs opacity-75">· {label}</span>
            </button>
          ))}
          <div className="flex items-center gap-1 ml-2">
            <input
              value={kInput}
              onChange={(e) => setKInput(e.target.value)}
              className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right"
            />
            <button
              disabled={busy || !(kParsed >= 0 && kParsed <= 1)}
              onClick={() => saveK(kParsed)}
              className="px-3 py-1.5 rounded-lg text-sm bg-gray-900 text-white disabled:opacity-40"
            >
              Сохранить
            </button>
          </div>
          <label className="flex items-center gap-1.5 text-xs text-gray-600 ml-2">
            <input type="checkbox" checked={reapply} onChange={(e) => setReapply(e.target.checked)} />
            применить новый K и к уже сделанным корректировкам
          </label>
        </div>
        {err && <div className="text-sm text-rose-600">{err}</div>}
      </div>

      {/* Уведомления */}
      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((a, i) => {
            if (a.type === 'big_deviation') {
              return (
                <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 flex gap-2 items-center">
                  <Icon name="TriangleAlert" size={16} />
                  <span>
                    {fmMonthLabel(a.month_id)} · {ADAPT_METRIC_LABEL[a.metric]}: отклонение факта от прогноза{' '}
                    <b>{num(a.deviation_pct, 1)}%</b> — больше {num(data.params.alert_pct, 0)}%. Проверьте, не разовый ли это
                    случай: при необходимости адаптацию можно отменить в таблице ниже.
                  </span>
                </div>
              );
            }
            if (a.type === 'systematic') {
              return (
                <div key={i} className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-sm text-violet-800 flex flex-wrap gap-2 items-center">
                  <Icon name="Repeat" size={16} />
                  <span className="flex-1">
                    «{a.item_name}»: систематическое отклонение {data.params.systematic_months} мес подряд. Предлагаем
                    изменить базовый прогноз на <b>{fmMoney(a.suggested)}</b> (среднее факта).
                  </span>
                  <button
                    disabled={busy}
                    onClick={() => run(() => adaptSetBase(a.item_id, a.suggested))}
                    className="px-3 py-1 rounded-lg bg-violet-600 text-white text-xs"
                  >
                    Сделать базой
                  </button>
                </div>
              );
            }
            if (a.type === 'new_item_average') {
              return (
                <div key={i} className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-sm text-sky-800 flex flex-wrap gap-2 items-center">
                  <Icon name="UserPlus" size={16} />
                  <span className="flex-1">
                    «{a.item_name}»: прошло {a.months} мес — пора перейти на среднее по факту <b>{fmMoney(a.suggested)}</b>.
                  </span>
                  <button
                    disabled={busy}
                    onClick={() => run(() => adaptSetBase(a.item_id, a.suggested))}
                    className="px-3 py-1 rounded-lg bg-sky-600 text-white text-xs"
                  >
                    Ввести среднее
                  </button>
                </div>
              );
            }
            return (
              <div key={i} className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-sm text-sky-800 flex gap-2 items-center">
                <Icon name="Sparkles" size={16} />
                <span>
                  «{a.item_name}» — новая неопределённость: прогноз по аналогии {fmMoney(a.amount)}, корректируется по факту
                  ({a.months_done} из 3 мес).
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Таблица адаптаций */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">История адаптаций</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Прогноз — значение, которое модель давала по месяцу до его закрытия ({data.active_scenario === 'base' ? 'базовый' : data.active_scenario} сценарий).
              Корректировка прибавляется ко всем будущим месяцам
            </p>
          </div>
          <label className="flex items-center gap-1.5 text-xs text-gray-500">
            <input type="checkbox" checked={showSkipped} onChange={(e) => setShowSkipped(e.target.checked)} />
            показывать ниже порога
          </label>
        </div>
        {log.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            Адаптаций пока нет. Первая появится, когда закроется месяц, по которому модель уже давала прогноз
            (1 ноября 2026 — за октябрь).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Месяц</th>
                  <th className="text-left px-4 py-2 font-medium">Метрика</th>
                  <th className="text-right px-4 py-2 font-medium">Прогноз</th>
                  <th className="text-right px-4 py-2 font-medium">Факт</th>
                  <th className="text-right px-4 py-2 font-medium">Отклонение</th>
                  <th className="text-right px-4 py-2 font-medium">Корректировка</th>
                  <th className="text-right px-4 py-2 font-medium">K</th>
                  <th className="text-left px-4 py-2 font-medium">Статус</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {log.map((l) => (
                  <tr key={l.id} className={l.status === 'cancelled' ? 'text-gray-400' : ''}>
                    <td className="px-4 py-2 font-medium">{fmMonthLabel(l.month_id)}</td>
                    <td className="px-4 py-2">
                      {ADAPT_METRIC_LABEL[l.metric]}
                      {l.item_name && <span className="text-gray-500"> · {l.item_name}</span>}
                      {l.note && <div className="text-[11px] text-gray-400">{l.note}</div>}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtValue(l, l.forecast)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtValue(l, l.actual)}</td>
                    <td className={`px-4 py-2 text-right tabular-nums ${l.deviation > 0 ? 'text-emerald-700' : l.deviation < 0 ? 'text-rose-700' : ''}`}>
                      {fmtDelta(l, l.deviation)}
                      {l.deviation_pct != null && l.metric !== 'variable_pct' && (
                        <div className="text-[11px] text-gray-400">{num(l.deviation_pct, 1)}%</div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-semibold">
                      {l.status === 'skipped' ? '—' : fmtDelta(l, l.correction)}
                      {l.applied_to && <div className="text-[11px] font-normal text-gray-400">{l.applied_to}</div>}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{num(l.k_coef, 1)}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS[l.status].cls}`}>{STATUS[l.status].label}</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {l.status === 'applied' && (
                        <button
                          disabled={busy}
                          onClick={() => run(() => cancelAdaptation(l.id))}
                          className="text-xs text-rose-600 hover:underline"
                        >
                          Отменить
                        </button>
                      )}
                      {l.status === 'cancelled' && Number(l.correction) !== 0 && (
                        <button
                          disabled={busy}
                          onClick={() => run(() => cancelAdaptation(l.id, true))}
                          className="text-xs text-gray-600 hover:underline"
                        >
                          Вернуть
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* График */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Прогноз vs факт</h3>
            <p className="text-xs text-gray-500">
              Слева от линии — закрытые месяцы (прогноз до закрытия и факт), справа — модельный и скорректированный прогноз
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            {(['avans', 'fact', 'variable_pct'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setChart(m)}
                className={`px-3 py-1 rounded-md text-xs ${chart === m ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
              >
                {ADAPT_METRIC_LABEL[m]}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={points} margin={{ left: 0, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="v" tickFormatter={fmtAxis} tick={{ fontSize: 11 }} width={52} domain={isPct ? ['auto', 'auto'] : [0, 'auto']} />
            {!isPct && <YAxis yAxisId="d" orientation="right" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} width={40} />}
            <Tooltip formatter={(v: number, name: string) => (name.includes('Отклонение') ? `${num(v, 1)}%` : fmtTip(v))} />
            <Legend />
            {firstFuture && <ReferenceLine yAxisId="v" x={firstFuture} stroke="#9ca3af" strokeDasharray="4 4" />}
            {!isPct && <Bar yAxisId="d" dataKey="dev" name="Отклонение, %" fill="#fcd34d" radius={[3, 3, 0, 0]} />}
            <Line yAxisId="v" dataKey="forecast" name="Прогноз (до закрытия)" stroke="#9ca3af" strokeDasharray="4 4" connectNulls={false} />
            <Line yAxisId="v" dataKey="actual" name="Факт" stroke="#4f46e5" strokeWidth={2} connectNulls={false} />
            <Line yAxisId="v" dataKey="model" name="Модельный прогноз" stroke="#94a3b8" connectNulls={false} dot={false} />
            <Line yAxisId="v" dataKey="corrected" name="Скорректированный" stroke="#7c3aed" strokeWidth={2} connectNulls={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Новая неопределённость */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900">Новая неопределённость</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Новый сотрудник или статья без истории: задайте прогноз по аналогии (например, средняя выработка существующих
            дизайнеров). Первые 3 месяца прогноз корректируется по факту каждого месяца, затем предложим перейти на среднее.
            Факт вносится в «Постоянные расходы» как ручная сумма месяца.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-gray-500">
            Статья
            <select
              value={newItem.mode}
              onChange={(e) => setNewItem({ ...newItem, mode: e.target.value })}
              className="block border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 mt-1"
            >
              {manualItems.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
              <option value="__new">+ новая статья</option>
            </select>
          </label>
          {newItem.mode === '__new' && (
            <label className="text-xs text-gray-500">
              Название
              <input
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="4-й дизайнер"
                className="block border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 mt-1 w-48"
              />
            </label>
          )}
          <label className="text-xs text-gray-500">
            С месяца
            <input
              type="month"
              value={newItem.month}
              onChange={(e) => setNewItem({ ...newItem, month: e.target.value })}
              className="block border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 mt-1"
            />
          </label>
          <label className="text-xs text-gray-500">
            Прогноз по аналогии, ₽/мес
            <input
              value={newItem.amount}
              onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
              placeholder="30000"
              className="block border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 mt-1 w-36 text-right"
            />
          </label>
          <button
            disabled={busy || !newItem.amount || (newItem.mode === '__new' && !newItem.name.trim())}
            onClick={() =>
              run(() =>
                adaptNewItem({
                  month: newItem.month,
                  amount: Number(newItem.amount.replace(/\s/g, '').replace(',', '.')),
                  ...(newItem.mode === '__new' ? { name: newItem.name.trim() } : { item_id: newItem.mode }),
                }),
              )
            }
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-40"
          >
            Задать
          </button>
        </div>
        {manualItems.some((i) => i.new_since) && (
          <div className="text-xs text-gray-500">
            Сейчас в режиме «по аналогии»:{' '}
            {manualItems.filter((i) => i.new_since).map((i) => `${i.name} (с ${fmMonthLabel(i.new_since!)}, ${fmMoney(i.amount)})`).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}
