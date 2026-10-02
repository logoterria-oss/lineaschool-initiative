import { Fragment, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { OneTimeData, OneTimeInput, OneTimeItem, fmMoney, fmMonthLabel } from '@/lib/finmodelApi';

interface Props {
  data: OneTimeData;
  onSave: (v: OneTimeInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const CAT_STYLE: Record<string, string> = {
  equipment: 'bg-sky-50 text-sky-700',
  software: 'bg-violet-50 text-violet-700',
  legal: 'bg-amber-50 text-amber-700',
  marketing: 'bg-pink-50 text-pink-700',
  training: 'bg-emerald-50 text-emerald-700',
  other: 'bg-gray-100 text-gray-600',
};

const toNum = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.'));

function ItemForm({ data, initial, onSave, onClose }: {
  data: OneTimeData;
  initial: OneTimeInput;
  onSave: Props['onSave'];
  onClose: () => void;
}) {
  const [v, setV] = useState({ ...initial, amount: initial.amount ? String(initial.amount) : '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const amount = toNum(v.amount);
  const bad = !v.name.trim() || !v.amount.trim() || Number.isNaN(amount) || amount <= 0;

  const submit = async () => {
    setBusy(true);
    setErr('');
    try {
      await onSave({ ...v, amount });
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setBusy(false);
    }
  };

  const field = 'w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-sm bg-white';
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="text-xs text-gray-500 space-y-1">
          <span>Месяц</span>
          <select className={field} value={v.month_id} onChange={(e) => setV({ ...v, month_id: e.target.value })}>
            {[...data.months].reverse().map((m) => (
              <option key={m} value={m}>{fmMonthLabel(m)}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-gray-500 space-y-1 lg:col-span-2">
          <span>Название</span>
          <input autoFocus className={field} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="Например, ноутбук" />
        </label>
        <label className="text-xs text-gray-500 space-y-1">
          <span>Сумма, ₽</span>
          <input className={`${field} text-right`} inputMode="decimal" value={v.amount} onChange={(e) => setV({ ...v, amount: e.target.value })} />
        </label>
        <label className="text-xs text-gray-500 space-y-1">
          <span>Категория</span>
          <select className={field} value={v.category} onChange={(e) => setV({ ...v, category: e.target.value })}>
            {data.categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-gray-500 space-y-1 sm:col-span-1 lg:col-span-3">
          <span>Комментарий</span>
          <input className={field} value={v.comment} onChange={(e) => setV({ ...v, comment: e.target.value })} placeholder="Необязательно" />
        </label>
      </div>
      {err && <div className="text-sm text-red-600">{err}</div>}
      <div className="flex gap-2">
        <button disabled={bad || busy} onClick={submit} className="px-4 py-1.5 rounded-md bg-gray-900 text-white text-sm disabled:opacity-40">
          {busy ? 'Сохраняем…' : initial.id ? 'Сохранить' : 'Добавить'}
        </button>
        <button onClick={onClose} className="px-4 py-1.5 rounded-md border border-gray-300 text-sm text-gray-600">Отмена</button>
      </div>
    </div>
  );
}

const OneTimeExpensesTable = ({ data, onSave, onDelete }: Props) => {
  const [form, setForm] = useState<OneTimeInput | null>(null);
  const [fMonth, setFMonth] = useState('');
  const [fCat, setFCat] = useState('');
  const [fYear, setFYear] = useState(data.current_month.slice(0, 4));
  const [deleting, setDeleting] = useState<number | null>(null);
  const catLabel = Object.fromEntries(data.categories.map((c) => [c.id, c.label]));

  const years = useMemo(
    () => Array.from(new Set([...data.items.map((i) => i.month_id.slice(0, 4)), data.current_month.slice(0, 4)])).sort().reverse(),
    [data],
  );

  const items = data.items.filter(
    (i) => (!fMonth || i.month_id === fMonth) && (!fCat || i.category === fCat) && (fMonth || !fYear || i.month_id.startsWith(fYear)),
  );
  const filteredTotal = items.reduce((s, i) => s + Number(i.amount), 0);

  const curTotal = data.by_month[data.current_month] || 0;
  const yearMonths = Object.entries(data.by_month).filter(([m]) => m.startsWith(fYear || data.current_month.slice(0, 4)));
  const yearTotal = yearMonths.reduce((s, [, v]) => s + v, 0);
  const lastMonthOfYear = (fYear || '') < data.current_month.slice(0, 4) ? 12 : Number(data.current_month.slice(5));
  const avg = yearTotal / Math.max(1, lastMonthOfYear);

  const groups = useMemo(() => {
    const g: { month: string; items: OneTimeItem[]; total: number }[] = [];
    for (const i of items) {
      let last = g[g.length - 1];
      if (!last || last.month !== i.month_id) {
        last = { month: i.month_id, items: [], total: 0 };
        g.push(last);
      }
      last.items.push(i);
      last.total += Number(i.amount);
    }
    return g;
  }, [items]);

  const del = async (id: number) => {
    if (!confirm('Удалить этот расход?')) return;
    setDeleting(id);
    try {
      await onDelete(id);
    } finally {
      setDeleting(null);
    }
  };

  const filterCls = 'px-2.5 py-1.5 border border-gray-300 rounded-md text-sm bg-white';

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Разовые расходы</h2>
            <p className="text-sm text-gray-500 mt-0.5 max-w-2xl">
              Нерегулярные траты: техника, ПО, юристы, ремонт и прочее. Не прогнозируются — по умолчанию 0 ₽, вводятся вручную, когда есть
              конкретное событие. Уменьшают EBITDA и чистый поток в своём месяце; на авансы, налоги, кредит и выплату не влияют.
            </p>
          </div>
          <button
            onClick={() => setForm({ month_id: data.current_month, name: '', amount: 0, category: 'other', comment: '' })}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700"
          >
            <Icon name="Plus" size={16} /> Добавить расход
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-xs text-gray-500">За {fmMonthLabel(data.current_month)}</div>
            <div className="text-lg font-bold text-gray-900">{fmMoney(curTotal)}</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-xs text-gray-500">За {fYear || data.current_month.slice(0, 4)} год</div>
            <div className="text-lg font-bold text-rose-700">{fmMoney(yearTotal)}</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-xs text-gray-500">В среднем в месяц</div>
            <div className="text-lg font-bold text-gray-900">{fmMoney(avg)}</div>
            <div className="text-[11px] text-gray-400">за {lastMonthOfYear} мес {fYear || ''}</div>
          </div>
        </div>
        {form && !form.id && (
          <div className="mt-4">
            <ItemForm data={data} initial={form} onSave={onSave} onClose={() => setForm(null)} />
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2">
          <div className="font-medium text-gray-900 mr-auto">Список расходов</div>
          <select className={filterCls} value={fYear} onChange={(e) => { setFYear(e.target.value); setFMonth(''); }}>
            <option value="">Все годы</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className={filterCls} value={fMonth} onChange={(e) => setFMonth(e.target.value)}>
            <option value="">Все месяцы</option>
            {[...data.months].reverse().filter((m) => !fYear || m.startsWith(fYear)).map((m) => (
              <option key={m} value={m}>{fmMonthLabel(m)}</option>
            ))}
          </select>
          <select className={filterCls} value={fCat} onChange={(e) => setFCat(e.target.value)}>
            <option value="">Все категории</option>
            {data.categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>

        {groups.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">Разовых расходов нет — по умолчанию 0 ₽</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Месяц</th>
                  <th className="text-left px-4 py-2 font-medium">Название</th>
                  <th className="text-left px-4 py-2 font-medium">Категория</th>
                  <th className="text-right px-4 py-2 font-medium">Сумма</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <Fragment key={g.month}>
                    {g.items.map((i, idx) =>
                      form?.id === i.id ? (
                        <tr key={i.id} className="border-t border-gray-100">
                          <td colSpan={5} className="px-4 py-3">
                            <ItemForm data={data} initial={{ ...i, amount: Number(i.amount) }} onSave={onSave} onClose={() => setForm(null)} />
                          </td>
                        </tr>
                      ) : (
                        <tr key={i.id} className="border-t border-gray-100 group hover:bg-gray-50/60">
                          <td className="px-4 py-2 whitespace-nowrap text-gray-600">{idx === 0 ? fmMonthLabel(g.month) : ''}</td>
                          <td className="px-4 py-2">
                            <div className="text-gray-900">{i.name}</div>
                            {i.comment && <div className="text-[11px] text-gray-400">{i.comment}</div>}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${CAT_STYLE[i.category] || CAT_STYLE.other}`}>
                              {catLabel[i.category] || i.category}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums font-medium">{fmMoney(Number(i.amount))}</td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            <button onClick={() => setForm({ ...i, amount: Number(i.amount) })} className="text-gray-400 hover:text-emerald-700 p-1" title="Редактировать">
                              <Icon name="Pencil" size={14} />
                            </button>
                            <button disabled={deleting === i.id} onClick={() => del(i.id)} className="text-gray-400 hover:text-red-600 p-1" title="Удалить">
                              <Icon name={deleting === i.id ? 'Loader2' : 'Trash2'} size={14} className={deleting === i.id ? 'animate-spin' : ''} />
                            </button>
                          </td>
                        </tr>
                      ),
                    )}
                    {g.items.length > 1 && (
                      <tr key={`${g.month}-total`} className="bg-gray-50/70 text-xs text-gray-600">
                        <td />
                        <td className="px-4 py-1.5" colSpan={2}>Итого за {fmMonthLabel(g.month)}</td>
                        <td className="px-4 py-1.5 text-right tabular-nums font-semibold">{fmMoney(g.total)}</td>
                        <td />
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-semibold">
                <tr className="border-t border-gray-200">
                  <td className="px-4 py-2" colSpan={3}>Итого по фильтру</td>
                  <td className="px-4 py-2 text-right tabular-nums">{fmMoney(filteredTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OneTimeExpensesTable;
