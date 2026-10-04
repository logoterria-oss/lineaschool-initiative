import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { BANK_CATEGORIES, BANK_CATEGORY_LABEL, BankCategory, BankData, BankRule, deleteBankRule, saveBankRule } from '@/lib/bankApi';

interface Props {
  data: BankData;
  onChanged: () => Promise<void>;
}

const FIELD_LABEL: Record<BankRule['field'], string> = {
  purpose: 'назначение содержит',
  counterparty: 'контрагент содержит',
  inn: 'ИНН контрагента =',
  account: 'счёт контрагента =',
};
const DIR_LABEL: Record<BankRule['direction'], string> = { in: 'приход', out: 'расход', any: 'любое' };

const empty: Partial<BankRule> = { direction: 'out', field: 'purpose', pattern: '', category: 'fixed', label: '', sort: 80 };

const BankRules = ({ data, onChanged }: Props) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<BankRule>>(empty);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setErr('');
    try {
      await fn();
      await onChanged();
      return true;
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка');
      return false;
    } finally {
      setBusy(false);
    }
  };
  const field = 'border border-gray-200 rounded-lg px-2 py-1.5 text-sm';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <button onClick={() => setOpen(!open)} className="w-full px-5 py-3 flex items-center gap-2 text-left">
        <Icon name="ListFilter" size={16} className="text-gray-500" />
        <span className="font-medium text-gray-900 flex-1">Правила разноски ({data.rules.length})</span>
        <span className="text-xs text-gray-400">проверяются по порядку, срабатывает первое</span>
        <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-gray-400" />
      </button>
      {open && (
        <div className="border-t border-gray-100 p-5 space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <select className={field} value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value as BankRule['direction'] })}>
              {(['out', 'in', 'any'] as const).map((d) => <option key={d} value={d}>{DIR_LABEL[d]}</option>)}
            </select>
            <select className={field} value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value as BankRule['field'] })}>
              {(Object.keys(FIELD_LABEL) as BankRule['field'][]).map((f) => <option key={f} value={f}>{FIELD_LABEL[f]}</option>)}
            </select>
            <input className={`${field} w-48`} placeholder="текст / ИНН" value={form.pattern} onChange={(e) => setForm({ ...form, pattern: e.target.value })} />
            <span className="text-gray-400">→</span>
            <select className={field} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as BankCategory })}>
              {BANK_CATEGORIES.filter((c) => c !== 'uncategorized').map((c) => <option key={c} value={c}>{BANK_CATEGORY_LABEL[c]}</option>)}
            </select>
            <input className={`${field} w-48`} placeholder="подпись (необязательно)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            <button
              disabled={busy || !form.pattern?.trim()}
              onClick={async () => { if (await run(() => saveBankRule(form))) setForm(empty); }}
              className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-40"
            >
              {form.id ? 'Сохранить' : 'Добавить'}
            </button>
            {form.id && <button onClick={() => setForm(empty)} className="text-sm text-gray-500">отмена</button>}
          </div>
          {err && <div className="text-sm text-rose-600">{err}</div>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {data.rules.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="py-1.5 pr-3 text-gray-400 text-xs">{DIR_LABEL[r.direction]}</td>
                    <td className="py-1.5 pr-3 text-gray-600">{FIELD_LABEL[r.field]} <span className="font-mono text-gray-900">«{r.pattern}»</span></td>
                    <td className="py-1.5 pr-3 font-medium text-gray-900 whitespace-nowrap">→ {BANK_CATEGORY_LABEL[r.category]}</td>
                    <td className="py-1.5 pr-3 text-gray-500 text-xs">{r.label}</td>
                    <td className="py-1.5 text-right whitespace-nowrap">
                      <button onClick={() => setForm(r)} className="text-gray-400 hover:text-gray-800 p-1" title="Изменить"><Icon name="Pencil" size={14} /></button>
                      <button disabled={busy} onClick={() => run(() => deleteBankRule(r.id))} className="text-gray-400 hover:text-rose-600 p-1" title="Удалить"><Icon name="Trash2" size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankRules;
