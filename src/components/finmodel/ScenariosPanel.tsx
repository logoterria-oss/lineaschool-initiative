import { useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import Icon from '@/components/ui/icon';
import {
  SCENARIOS, Scenario, ScenarioDef, ScenarioInput, ScenariosData, deleteScenario, fmMonthLabel, saveScenario,
} from '@/lib/finmodelApi';
import SensitivityPanel from './SensitivityPanel';
import { COMPARE_ROWS, EXTRA_COLORS, SC_COLOR, exportScenariosXlsx, kRub, num, toneCls } from './scenarioUtils';

interface Props {
  data: ScenariosData;
  active: Scenario;
  onActive: (sc: Scenario) => void;
  onChanged: () => Promise<void>;
}

type View = 'compare' | 'sensitivity' | 'manager';

const describe = (s: ScenarioDef, bp: ScenariosData['base_params']) => {
  const parts = [`коэф. ${String(s.growth_coef).replace('.', ',')}`];
  if (s.price_change_pct) parts.push(`цена ${s.price_change_pct > 0 ? '+' : '−'}${Math.abs(s.price_change_pct)}% (${num(bp.price * (1 + s.price_change_pct / 100))} ₽)`);
  if (s.students_override) parts.push(`${s.students_override} учеников`);
  if (s.advertising_override != null) parts.push(`реклама ${num(s.advertising_override)} ₽/мес`);
  if (s.staff_changes?.teachers) parts.push(`+${s.staff_changes.teachers} педагог. в найм`);
  if (s.credit_option) parts.push(`кредит ${s.credit_option === '12m' ? '12' : '6'} мес`);
  if (s.payout_pct != null) parts.push(`выплата ${s.payout_pct}%`);
  return parts.join(' · ');
};

const EMPTY: ScenarioInput = {
  name: '', growth_coef: 1.4, price_change_pct: 0, students_override: null, advertising_override: null,
  staff_changes: { teachers: 0 }, credit_option: null, payout_pct: null, note: '',
};

const ScenarioForm = ({ initial, onCancel, onSave }: {
  initial: ScenarioInput; onCancel: () => void; onSave: (v: ScenarioInput) => Promise<void>;
}) => {
  const [v, setV] = useState<ScenarioInput>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof ScenarioInput, val: unknown) => setV((p) => ({ ...p, [k]: val }));
  const n = (s: string) => (s === '' ? null : Number(s.replace(',', '.')));
  const field = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm';

  const submit = async () => {
    if (!v.name.trim()) return setErr('Введите название');
    setBusy(true);
    setErr('');
    try {
      await onSave(v);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 space-y-3">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="text-xs text-gray-500 sm:col-span-2">Название
          <input className={field} value={v.name} onChange={(e) => set('name', e.target.value)} placeholder="Например, «Цена +10% и 2 педагога»" />
        </label>
        <label className="text-xs text-gray-500">Коэф. роста авансов
          <input className={field} type="number" step="0.05" value={v.growth_coef ?? ''} onChange={(e) => set('growth_coef', n(e.target.value))} />
        </label>
        <label className="text-xs text-gray-500">Изменение цены, %
          <input className={field} type="number" step="1" value={v.price_change_pct ?? 0} onChange={(e) => set('price_change_pct', n(e.target.value) ?? 0)} />
        </label>
        <label className="text-xs text-gray-500">Учеников (пусто — как сейчас)
          <input className={field} type="number" value={v.students_override ?? ''} onChange={(e) => set('students_override', n(e.target.value))} />
        </label>
        <label className="text-xs text-gray-500">Реклама, ₽/мес (пусто — как в модели)
          <input className={field} type="number" step="1000" value={v.advertising_override ?? ''} onChange={(e) => set('advertising_override', n(e.target.value))} />
        </label>
        <label className="text-xs text-gray-500">Педагогов в найм (+)
          <input className={field} type="number" min={0} value={v.staff_changes?.teachers ?? 0} onChange={(e) => set('staff_changes', { teachers: n(e.target.value) ?? 0 })} />
        </label>
        <label className="text-xs text-gray-500">Кредит
          <select className={field} value={v.credit_option ?? ''} onChange={(e) => set('credit_option', e.target.value || null)}>
            <option value="">Как в модели</option>
            <option value="6m">6 месяцев</option>
            <option value="12m">12 месяцев</option>
          </select>
        </label>
        <label className="text-xs text-gray-500">Выплата собственнику, % (пусто — как в модели)
          <input className={field} type="number" min={0} max={100} value={v.payout_pct ?? ''} onChange={(e) => set('payout_pct', n(e.target.value))} />
        </label>
        <label className="text-xs text-gray-500 sm:col-span-2 lg:col-span-3">Комментарий
          <input className={field} value={v.note ?? ''} onChange={(e) => set('note', e.target.value)} />
        </label>
      </div>
      {err && <div className="text-sm text-rose-600">{err}</div>}
      <div className="flex gap-2">
        <button disabled={busy} onClick={submit} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-50">
          {busy ? 'Считаем…' : 'Сохранить и посчитать'}
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Отмена</button>
      </div>
    </div>
  );
};

const ScenariosPanel = ({ data, active, onActive, onChanged }: Props) => {
  const [view, setView] = useState<View>('compare');
  const [selected, setSelected] = useState<string[]>(['min', 'base', 'opt']);
  const [editing, setEditing] = useState<ScenarioInput | null>(null);
  const bp = data.base_params;
  const nz = bp.near_zero;
  const byId = useMemo(() => Object.fromEntries(data.scenarios.map((s) => [s.id, s])), [data.scenarios]);
  const ids = selected.filter((id) => data.results[id]);
  const colorOf = (id: string) => SC_COLOR[id] || EXTRA_COLORS[data.scenarios.filter((s) => !s.is_builtin).findIndex((s) => s.id === id) % EXTRA_COLORS.length];

  const toggle = (id: string) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const res = (id: string) => data.results[id].annual;

  const np = ids.map((id) => res(id).net_profit);
  const eb = ids.map((id) => res(id).end_balance);
  const spread = (a: number[]) => (a.length > 1 ? Math.max(...a) - Math.min(...a) : 0);

  const bars = ids.map((id) => ({ id, name: byId[id].name, net_profit: res(id).net_profit, end_balance: res(id).end_balance }));
  const lines = data.months.map((m, i) => ({ m: fmMonthLabel(m), ...Object.fromEntries(ids.map((id) => [id, data.results[id].monthly[i]?.end_balance])) }));
  const gaps = SCENARIOS.map((sc) => ({ sc, gap: res(sc).gap_months }));
  const checkOk = Object.values(data.check).every((c) => Math.abs(c.diff) < 1);

  const onSave = async (v: ScenarioInput) => {
    const r = await saveScenario(v);
    setEditing(null);
    await onChanged();
    if (r.id && !selected.includes(r.id)) setSelected((p) => [...p, r.id]);
  };
  const onDelete = async (s: ScenarioDef) => {
    if (!confirm(`Удалить сценарий «${s.name}»?`)) return;
    await deleteScenario(s.id);
    setSelected((p) => p.filter((x) => x !== s.id));
    await onChanged();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
          {([['compare', 'Сравнение'], ['sensitivity', 'Чувствительность «что если»'], ['manager', 'Диспетчер сценариев']] as [View, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setView(k)}
              className={`px-3 py-1.5 rounded-md text-sm ${view === k ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-white'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={() => exportScenariosXlsx(data, ids.length ? ids : ['min', 'base', 'opt'])}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
          <Icon name="FileSpreadsheet" size={16} /> Экспорт в Excel
        </button>
      </div>

      {view === 'sensitivity' && <SensitivityPanel data={data} />}

      {view === 'manager' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900 flex-1">Диспетчер сценариев</h3>
            {!editing && (
              <button onClick={() => setEditing({ ...EMPTY })} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm">
                <Icon name="Plus" size={16} /> Новый сценарий
              </button>
            )}
          </div>
          {editing && <ScenarioForm initial={editing} onCancel={() => setEditing(null)} onSave={onSave} />}
          <div className="divide-y divide-gray-100">
            {data.scenarios.map((s) => {
              const a = res(s.id);
              return (
                <div key={s.id} className="py-3 flex flex-wrap items-center gap-3">
                  <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} className="w-4 h-4" />
                  <span className="w-3 h-3 rounded-full" style={{ background: colorOf(s.id) }} />
                  <div className="flex-1 min-w-[220px]">
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {s.name}
                      {s.is_builtin && <span className="text-[10px] uppercase tracking-wide text-gray-400 border border-gray-200 rounded px-1">базовый</span>}
                      {s.id === active && <span className="text-[10px] uppercase tracking-wide text-emerald-700 bg-emerald-50 rounded px-1">активный</span>}
                    </div>
                    <div className="text-xs text-gray-500">{describe(s, bp)}{s.note ? ` — ${s.note}` : ''}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className={`inline-block px-1.5 rounded ${toneCls(a.net_profit, nz)}`}>{num(a.net_profit)} ₽</div>
                    <div className="text-xs text-gray-400">остаток {num(a.end_balance)} ₽</div>
                  </div>
                  <div className="flex gap-1">
                    {s.is_builtin ? (
                      s.id !== active && (
                        <button onClick={() => onActive(s.id as Scenario)} className="px-2 py-1 text-xs rounded border border-gray-200 hover:bg-gray-50">Сделать активным</button>
                      )
                    ) : (
                      <>
                        <button title="Изменить" onClick={() => setEditing({ ...s })} className="p-1.5 text-gray-400 hover:text-gray-700"><Icon name="Pencil" size={15} /></button>
                        <button title="Удалить" onClick={() => onDelete(s)} className="p-1.5 text-gray-400 hover:text-rose-600"><Icon name="Trash2" size={15} /></button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400">
            Отмеченные сценарии попадают в сравнение и экспорт. Активный сценарий (мин / база / опт) используется на остальных вкладках модели.
          </p>
        </div>
      )}

      {view === 'compare' && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="text-xs text-gray-500 mb-2">Сравниваем бок о бок:</div>
            <div className="flex flex-wrap gap-2">
              {data.scenarios.map((s) => (
                <button key={s.id} onClick={() => toggle(s.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border ${
                    selected.includes(s.id) ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  <span className="w-2 h-2 rounded-full" style={{ background: colorOf(s.id) }} /> {s.name}
                </button>
              ))}
            </div>
          </div>

          {ids.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">Отметьте хотя бы один сценарий</div>
          ) : (
            <>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-500">Разброс чистой прибыли</div>
                  <div className="text-2xl font-bold text-gray-900">{num(spread(np))} ₽</div>
                  <div className="text-xs text-gray-400">от {num(Math.min(...np))} до {num(Math.max(...np))}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-500">Разброс остатка на конец</div>
                  <div className="text-2xl font-bold text-gray-900">{num(spread(eb))} ₽</div>
                  <div className="text-xs text-gray-400">от {num(Math.min(...eb))} до {num(Math.max(...eb))}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-500">Кассовый разрыв (остаток &lt; 0)</div>
                  {gaps.map(({ sc, gap }) => (
                    <div key={sc} className="text-sm">
                      <span className="text-gray-500">{byId[sc]?.name}: </span>
                      {gap.length ? <span className="text-rose-600">{fmMonthLabel(gap[0])} – {fmMonthLabel(gap[gap.length - 1])}</span> : <span className="text-emerald-700">нет</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-gray-500">
                      <th className="text-left px-4 py-3 font-normal sticky left-0 bg-white">Показатель за 12 мес · {fmMonthLabel(data.months[0])} – {fmMonthLabel(data.months[data.months.length - 1])}</th>
                      {ids.map((id) => (
                        <th key={id} className="text-right px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: colorOf(id) }} />
                          {byId[id].name}
                          <div className="text-[11px] font-normal text-gray-400">коэф. {String(byId[id].growth_coef).replace('.', ',')}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE_ROWS.map((r) => (
                      <tr key={r.key} className={`border-b border-gray-50 ${r.strong ? 'font-semibold' : ''}`}>
                        <td className="px-4 py-2 text-gray-700 sticky left-0 bg-white">{r.label}</td>
                        {ids.map((id) => {
                          const v = Number(res(id)[r.key]) || 0;
                          return (
                            <td key={id} className="px-4 py-2 text-right whitespace-nowrap">
                              {r.tone ? <span className={`px-1.5 py-0.5 rounded ${toneCls(v, nz)}`}>{num(v)}</span> : num(v)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    <tr className="text-xs text-gray-500">
                      <td className="px-4 py-2 sticky left-0 bg-white">Минимальный остаток</td>
                      {ids.map((id) => (
                        <td key={id} className="px-4 py-2 text-right whitespace-nowrap">
                          {num(res(id).min_balance ?? 0)} {res(id).min_month && `· ${fmMonthLabel(res(id).min_month!)}`}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
                <div className="px-4 py-3 text-xs text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
                  <span><span className="px-1 rounded bg-rose-50 text-rose-600">красный</span> — минус</span>
                  <span><span className="px-1 rounded bg-amber-50 text-amber-700">жёлтый</span> — от 0 до {num(nz)} ₽</span>
                  <span><span className="px-1 rounded bg-emerald-50 text-emerald-700">зелёный</span> — плюс</span>
                  <span>Выплата собственнику — не расход P&L, только отток Cash Flow.</span>
                  <span className={checkOk ? 'text-emerald-600' : 'text-rose-600'}>
                    {checkOk ? '✓ Мин / база / опт совпадают с вкладкой Cash Flow' : '⚠ Расхождение с вкладкой Cash Flow — откройте её для пересчёта'}
                  </span>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                {(['net_profit', 'end_balance'] as const).map((k) => (
                  <div key={k} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <div className="text-sm font-medium text-gray-900 mb-2">{k === 'net_profit' ? 'Чистая прибыль по сценариям' : 'Остаток на конец по сценариям'}</div>
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={bars} margin={{ left: 8, right: 8, top: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" fontSize={11} interval={0} />
                          <YAxis tickFormatter={kRub} fontSize={11} width={56} />
                          <Tooltip formatter={(v: number) => `${num(v)} ₽`} />
                          <ReferenceLine y={0} stroke="#94a3b8" />
                          <Bar dataKey={k} radius={[4, 4, 0, 0]}>
                            {bars.map((b) => <Cell key={b.id} fill={b[k] < 0 ? '#f43f5e' : colorOf(b.id)} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="text-sm font-medium text-gray-900 mb-2">Динамика остатка Cash Flow по сценариям</div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lines} margin={{ left: 8, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="m" fontSize={11} />
                      <YAxis tickFormatter={kRub} fontSize={11} width={56} />
                      <Tooltip formatter={(v: number, n: string) => [`${num(v)} ₽`, byId[n]?.name || n]} />
                      <Legend formatter={(v) => byId[v]?.name || v} />
                      <ReferenceLine y={0} stroke="#f43f5e" strokeDasharray="4 4" />
                      {ids.map((id) => (
                        <Line key={id} dataKey={id} stroke={colorOf(id)} strokeWidth={id === active ? 3 : 2} dot={false} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ScenariosPanel;
