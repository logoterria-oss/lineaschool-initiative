import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { DashboardData, fmMoney, fmMonthLabel, setFixedExpense, setMonthInputs } from '@/lib/finmodelApi';
import { SOURCE_STATUS } from './dashboardUtils';

export const DataSourcesBlock = ({ data }: { data: DashboardData }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
    <div className="flex items-center gap-2 mb-3">
      <Icon name="Database" size={18} className="text-gray-500" />
      <h3 className="font-semibold text-gray-900">Источники данных</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-500 border-b">
            <th className="text-left py-2 font-normal">Источник</th>
            <th className="text-left py-2 font-normal">Что берёт</th>
            <th className="text-left py-2 font-normal">Обновлено</th>
            <th className="text-left py-2 font-normal">Статус</th>
          </tr>
        </thead>
        <tbody>
          {data.sources.map((s) => {
            const st = SOURCE_STATUS[s.status] || SOURCE_STATUS.manual;
            return (
              <tr key={s.source} className="border-b border-gray-50 align-top">
                <td className="py-2 pr-3 text-gray-900">{s.label}</td>
                <td className="py-2 pr-3 text-gray-600">{s.provides}</td>
                <td className="py-2 pr-3 text-gray-600 whitespace-nowrap">
                  {s.last_updated ? new Date(s.last_updated).toLocaleDateString('ru-RU') : '—'}
                </td>
                <td className="py-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${st.cls}`}>{st.label}</span>
                  {s.note && <div className="text-[11px] text-gray-400 mt-0.5">{s.note}</div>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

interface ManualProps {
  data: DashboardData;
  onChanged: () => Promise<void>;
  onGo: (target: string) => void;
}

const QUICK_ITEMS = ['advertising', 'neural_irregular', 'designers'];

export const ManualInputsBlock = ({ data, onChanged, onGo }: ManualProps) => {
  const months = data.months;
  const [month, setMonth] = useState(months.find((m) => m >= data.current_month) || months[0]);
  const [item, setItem] = useState('advertising');
  const [amount, setAmount] = useState('');
  const [shifts, setShifts] = useState('');
  const [rate, setRate] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const items = data.manual.items.filter((i) => QUICK_ITEMS.includes(i.id) || i.id.startsWith('new_'));
  const num = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.'));

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setErr('');
    try {
      await fn();
      await onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setBusy(false);
    }
  };

  const m = data.manual;
  const overrides = [
    ...m.expenses.map((e) => `${e.name} · ${fmMonthLabel(e.month_id)}: ${fmMoney(e.amount)}`),
    ...m.inputs.flatMap((i) => [
      i.admin_shifts_override != null ? `Смены админов · ${fmMonthLabel(i.month_id)}: ${i.admin_shifts_override}` : '',
      i.admin_rate_override != null ? `Ставка админа (KPI) · ${fmMonthLabel(i.month_id)}: ${fmMoney(i.admin_rate_override)}` : '',
      i.ruo_replacements != null ? `Замены РУО · ${fmMonthLabel(i.month_id)}: ${i.ruo_replacements} ур.` : '',
      i.payout_pct_override != null ? `Выплата · ${fmMonthLabel(i.month_id)}: ${i.payout_pct_override}%` : '',
      i.payout_manual != null ? `Выплата вручную · ${fmMonthLabel(i.month_id)}: ${fmMoney(i.payout_manual)}` : '',
      i.tax_regime_override ? `Налог · ${fmMonthLabel(i.month_id)}: ${i.tax_regime_override === 'usn' ? 'УСН' : 'патент'}` : '',
    ]).filter(Boolean),
    ...m.variable_pct.map((v) => `Переменный % · ${fmMonthLabel(v.month_id)}: ${String(v.variable_pct).replace('.', ',')}%`),
    ...m.staff.map((s) => `${s.name} · ${fmMonthLabel(s.month_id)}: ${fmMoney(s.rate_override)}`),
  ];
  const field = 'border border-gray-200 rounded-lg px-2 py-1.5 text-sm';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Icon name="PencilLine" size={18} className="text-gray-500" />
        <h3 className="font-semibold text-gray-900 flex-1">Ручные вводы</h3>
        <button onClick={() => onGo('fixed')} className="text-xs text-indigo-600 hover:underline">все статьи →</button>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs text-gray-500">Месяц
          <select className={`${field} block`} value={month} onChange={(e) => setMonth(e.target.value)}>
            {months.map((x) => <option key={x} value={x}>{fmMonthLabel(x)}</option>)}
          </select>
        </label>
        <label className="text-xs text-gray-500">Статья
          <select className={`${field} block`} value={item} onChange={(e) => setItem(e.target.value)}>
            {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </label>
        <label className="text-xs text-gray-500">Сумма, ₽
          <input className={`${field} block w-28 text-right`} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="75000" />
        </label>
        <button disabled={busy || !amount || Number.isNaN(num(amount))} onClick={() => run(() => setFixedExpense(month, item, num(amount)))}
          className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-40">Сохранить</button>
        <button disabled={busy} onClick={() => run(() => setFixedExpense(month, item, null))}
          className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100">По умолчанию</button>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="text-xs text-gray-500 w-full">KPI админов за {fmMonthLabel(month)}</div>
        <label className="text-xs text-gray-500">Смен
          <input className={`${field} block w-20 text-right`} value={shifts} onChange={(e) => setShifts(e.target.value)} placeholder="30" />
        </label>
        <label className="text-xs text-gray-500">Ставка за смену, ₽
          <input className={`${field} block w-28 text-right`} value={rate} onChange={(e) => setRate(e.target.value)} placeholder="700" />
        </label>
        <button
          disabled={busy || (!shifts && !rate)}
          onClick={() => run(() => setMonthInputs(month, {
            ...(shifts ? { admin_shifts_override: num(shifts) } : {}),
            ...(rate ? { admin_rate_override: num(rate) } : {}),
          }))}
          className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-40"
        >Сохранить</button>
        <button disabled={busy} onClick={() => run(() => setMonthInputs(month, { admin_shifts_override: null, admin_rate_override: null }))}
          className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Сбросить</button>
      </div>
      {err && <div className="text-sm text-rose-600">{err}</div>}

      <div>
        <div className="text-xs text-gray-500 mb-1">Действующие ручные значения ({overrides.length})</div>
        {overrides.length === 0 ? (
          <div className="text-sm text-gray-400">Нет — всё по умолчанию</div>
        ) : (
          <ul className="text-sm text-gray-700 space-y-0.5 max-h-48 overflow-y-auto">
            {overrides.map((o) => <li key={o} className="flex gap-1.5"><span className="text-amber-500">•</span>{o}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
};
