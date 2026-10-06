import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { CostChange, FixedData, FixedModelOp, fmMonthLabel } from '@/lib/finmodelApi';

interface Target {
  kind: 'staff' | 'item';
  id: string;
  name: string;
  unit: string;
  current: number;
  shifts?: number;
}

interface Props {
  data: FixedData;
  onAction: (v: FixedModelOp) => Promise<void>;
}

const toNum = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.'));
const money = (v: number) => `${Math.round(v).toLocaleString('ru-RU')}`;

/** Все, у кого можно менять стоимость: сотрудники на окладе, админы (ставка × смены) и статьи расходов. */
export const costTargets = (data: FixedData): Target[] => {
  const out: Target[] = [];
  const admin = data.staff.find((s) => s.role === 'admin');
  if (admin) {
    out.push({
      kind: 'staff', id: 'admins', name: 'Админы', unit: '₽/смена',
      current: data.admin_rate_default, shifts: data.admin_shifts_default,
    });
  }
  data.staff
    .filter((s) => s.role !== 'admin' && s.rate_unit === 'rub_month')
    .forEach((s) => out.push({ kind: 'staff', id: s.id, name: s.name, unit: '₽/мес', current: s.rate || 0 }));
  data.items.forEach((it) => out.push({
    kind: 'item', id: it.id, name: it.name, unit: '₽/мес',
    current: it.amount_unit === 'rub_year' ? (it.amount || 0) / 12 : it.amount || 0,
  }));
  return out;
};

function ChangeForm({ target, months, initial, onSave, onCancel }: {
  target: Target;
  months: string[];
  initial?: CostChange;
  onSave: (v: { from_month: string; amount: number; shifts: number | null; note: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [month, setMonth] = useState(initial?.from_month || months[1] || months[0] || '');
  const [amount, setAmount] = useState(initial ? String(Math.round(initial.amount)) : String(Math.round(target.current)));
  const [shifts, setShifts] = useState(String(initial?.shifts ?? target.shifts ?? ''));
  const [note, setNote] = useState(initial?.note || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const isAdmin = target.id === 'admins';
  const bad = Number.isNaN(toNum(amount)) || toNum(amount) < 0 || amount.trim() === ''
    || (isAdmin && (shifts.trim() === '' || Number.isNaN(toNum(shifts)) || toNum(shifts) < 0));
  const perMonth = isAdmin ? toNum(amount) * toNum(shifts) : toNum(amount);

  const save = async () => {
    setBusy(true);
    setErr('');
    try {
      await onSave({ from_month: month, amount: toNum(amount), shifts: isAdmin ? Math.round(toNum(shifts)) : null, note });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-[11px] text-gray-500 flex flex-col gap-0.5">
          С месяца
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white text-gray-900">
            {months.map((m) => <option key={m} value={m}>{fmMonthLabel(m)}</option>)}
          </select>
        </label>
        <label className="text-[11px] text-gray-500 flex flex-col gap-0.5">
          {isAdmin ? 'Ставка, ₽/смена' : 'Новая стоимость, ₽/мес'}
          <input value={amount} onChange={(e) => setAmount(e.target.value)} className="w-28 border border-gray-300 rounded px-2 py-1.5 text-sm text-right text-gray-900" />
        </label>
        {isAdmin && (
          <label className="text-[11px] text-gray-500 flex flex-col gap-0.5">
            Смен в месяц
            <input value={shifts} onChange={(e) => setShifts(e.target.value)} className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm text-right text-gray-900" />
          </label>
        )}
        <label className="text-[11px] text-gray-500 flex flex-col gap-0.5 flex-1 min-w-[160px]">
          Комментарий
          <input
            value={note}
            placeholder={isAdmin ? 'например: 1 админ, 5/2, KPI' : 'например: снижаем бюджет'}
            onChange={(e) => setNote(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900"
          />
        </label>
        <button
          disabled={busy || bad || !month}
          onClick={save}
          className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-40 inline-flex items-center gap-1"
        >
          {busy && <Icon name="Loader2" size={14} className="animate-spin" />}
          Сохранить
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100">Отмена</button>
      </div>
      {isAdmin && !bad && (
        <div className="text-xs text-gray-600">= {money(perMonth)} ₽/мес до страховых и отпускных</div>
      )}
      {err && <div className="text-xs text-red-600">{err}</div>}
    </div>
  );
}

/**
 * Изменения стоимости во времени: «с ноября реклама 40 000», «с октября 1 админ, 22 смены по 1 200».
 * Изменение действует с выбранного месяца до следующего изменения. Модель пересчитывается сразу.
 */
const CostChanges = ({ data, onAction }: Props) => {
  const targets = costTargets(data);
  const months = data.months.filter((m) => m >= data.current_month);
  const [pick, setPick] = useState(targets[0] ? `${targets[0].kind}:${targets[0].id}` : '');
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const byKey = Object.fromEntries(targets.map((t) => [`${t.kind}:${t.id}`, t]));
  const target = byKey[pick];

  const changes = [...data.cost_changes].sort((a, b) =>
    (byKey[`${a.kind}:${a.target_id}`]?.name || '').localeCompare(byKey[`${b.kind}:${b.target_id}`]?.name || '')
    || a.from_month.localeCompare(b.from_month));

  const save = (t: Target, prev?: CostChange) => async (v: { from_month: string; amount: number; shifts: number | null; note: string }) => {
    await onAction({ op: 'change_set', kind: t.kind, target_id: t.id, ...v });
    if (prev && prev.from_month !== v.from_month) await onAction({ op: 'change_delete', change_id: prev.id });
    setAdding(false);
    setEditId(null);
  };

  const fmtValue = (ch: CostChange) => (ch.target_id === 'admins'
    ? `${money(ch.amount)} ₽ × ${ch.shifts ?? data.admin_shifts_default} смен = ${money(ch.amount * (ch.shifts ?? data.admin_shifts_default))} ₽/мес`
    : `${money(ch.amount)} ₽/мес`);

  const currentOf = (t: Target) => (t.id === 'admins'
    ? `${money(t.current)} ₽ × ${t.shifts} смен`
    : `${money(t.current)} ₽/мес`);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">Изменения стоимости</h3>
          <p className="text-xs text-gray-500 mt-0.5 max-w-3xl">
            Новая цена сотрудника или расхода с выбранного месяца — действует до следующего изменения.
            Например: «Реклама с ноября — 40 000 ₽», «Админы с ноября — 1 человек, 22 смены по 1 200 ₽».
            P&L, Cash Flow, налоги и дашборд пересчитываются сразу.
          </p>
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)} className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50 inline-flex items-center gap-1">
            <Icon name="TrendingDown" size={14} /> Изменить стоимость
          </button>
        )}
      </div>

      {adding && (
        <div className="px-5 pt-4 space-y-2">
          <label className="text-[11px] text-gray-500 flex flex-col gap-0.5 max-w-sm">
            Что меняем
            <select value={pick} onChange={(e) => setPick(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white text-gray-900">
              <optgroup label="Сотрудники">
                {targets.filter((t) => t.kind === 'staff').map((t) => (
                  <option key={t.id} value={`staff:${t.id}`}>{t.name} — сейчас {currentOf(t)}</option>
                ))}
              </optgroup>
              <optgroup label="Расходы">
                {targets.filter((t) => t.kind === 'item').map((t) => (
                  <option key={t.id} value={`item:${t.id}`}>{t.name} — сейчас {currentOf(t)}</option>
                ))}
              </optgroup>
            </select>
          </label>
          {target && (
            <ChangeForm key={pick} target={target} months={months} onSave={save(target)} onCancel={() => setAdding(false)} />
          )}
        </div>
      )}

      <div className="p-5 pt-3">
        {changes.length === 0 ? (
          <div className="text-sm text-gray-400 py-2">Изменений пока нет — модель считает по текущим ставкам и суммам.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {changes.map((ch) => {
              const t = byKey[`${ch.kind}:${ch.target_id}`];
              return (
                <div key={ch.id} className="py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-xs font-medium text-emerald-700">с {fmMonthLabel(ch.from_month)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900">{t?.name || ch.target_id}</div>
                      <div className="text-[11px] text-gray-500">
                        {t && <>было {currentOf(t)} → </>}
                        <b className="text-gray-800">{fmtValue(ch)}</b>
                        {ch.note && <> · {ch.note}</>}
                      </div>
                    </div>
                    <button onClick={() => setEditId(ch.id)} className="text-gray-400 hover:text-emerald-700" title="Изменить">
                      <Icon name="Pencil" size={14} />
                    </button>
                    <button
                      onClick={() => window.confirm('Убрать это изменение стоимости?') && onAction({ op: 'change_delete', change_id: ch.id })}
                      className="text-gray-400 hover:text-red-600"
                      title="Убрать"
                    >
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                  {editId === ch.id && t && (
                    <div className="mt-2">
                      <ChangeForm target={t} months={months} initial={ch} onSave={save(t, ch)} onCancel={() => setEditId(null)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CostChanges;
