import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { fmMoney, fmMonthLabel } from '@/lib/finmodelApi';
import {
  BANK_CATEGORIES, BANK_CATEGORY_LABEL, BankCategory, BankData, resetOperationCategory, setOperationCategory,
} from '@/lib/bankApi';

interface Props {
  data: BankData;
  onMonth: (m: string) => void;
  onChanged: () => Promise<void>;
}

const CF_LINES: BankCategory[] = ['revenue', 'variable', 'fixed', 'ano', 'one_time', 'tax', 'interest', 'body', 'payout', 'other'];

const BankOperations = ({ data, onMonth, onChanged }: Props) => {
  const [onlyUnc, setOnlyUnc] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [err, setErr] = useState('');
  const ops = data.operations.filter((o) => !onlyUnc || o.category === 'uncategorized');
  const work = data.operations.filter((o) => data.accounts.find((a) => a.account === o.account)?.use_in_cf);

  const totals = CF_LINES.map((c) => {
    const v = work.filter((o) => o.category === c || (c === 'other' && o.category === 'uncategorized'))
      .reduce((s, o) => {
        const signIn = c === 'revenue' || c === 'other' ? 1 : -1;
        return s + (o.direction === 'in' ? signIn : -signIn) * Number(o.amount);
      }, 0);
    return { c, v };
  });
  const unc = data.operations.filter((o) => o.category === 'uncategorized').length;

  const change = async (id: number, cat: BankCategory, rule: boolean) => {
    setBusy(id);
    setErr('');
    try {
      if (cat === 'uncategorized') await resetOperationCategory(id);
      else await setOperationCategory(id, cat, rule);
      await onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <div className="font-medium text-gray-900 flex-1">Операции и разноска</div>
        <select value={data.month} onChange={(e) => onMonth(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5">
          {data.months.map((m) => (
            <option key={m.m} value={m.m}>{fmMonthLabel(m.m)} · {m.n} оп.{m.unc ? ` · ${m.unc} не разнесено` : ''}</option>
          ))}
        </select>
        <label className="text-sm text-gray-600 flex items-center gap-1.5">
          <input type="checkbox" checked={onlyUnc} onChange={(e) => setOnlyUnc(e.target.checked)} />
          только неразнесённые {unc > 0 && <span className="text-rose-600 font-medium">({unc})</span>}
        </label>
      </div>

      <div className="px-5 py-3 border-b border-gray-100 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        {totals.map(({ c, v }) => (
          <div key={c} className="rounded-lg bg-gray-50 px-2.5 py-1.5">
            <div className="text-gray-500">{BANK_CATEGORY_LABEL[c]}</div>
            <div className={`font-semibold tabular-nums ${v === 0 ? 'text-gray-300' : 'text-gray-900'}`}>{fmMoney(v)}</div>
          </div>
        ))}
      </div>
      {err && <div className="px-5 py-2 text-sm text-rose-600">{err}</div>}

      {data.operations.length === 0 ? (
        <div className="p-10 text-center text-gray-400 text-sm">Операций пока нет — загрузите выписку или синхронизируйте Т-Бизнес</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Дата</th>
                <th className="text-right px-3 py-2 font-medium">Сумма</th>
                <th className="text-left px-3 py-2 font-medium">Контрагент и назначение</th>
                <th className="text-left px-3 py-2 font-medium min-w-[220px]">Строка Cash Flow</th>
              </tr>
            </thead>
            <tbody>
              {ops.map((o) => (
                <tr key={o.id} className={`border-t border-gray-100 align-top ${o.category === 'uncategorized' ? 'bg-rose-50/50' : ''}`}>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-600">
                    {new Date(o.op_date).toLocaleDateString('ru-RU')}
                    <div className="text-[10px] text-gray-400">{o.bank === 'loko' ? 'Локо' : 'Т-Банк'} · {o.source === 'api' ? 'API' : 'файл'}</div>
                  </td>
                  <td className={`px-3 py-2 text-right tabular-nums whitespace-nowrap font-medium ${o.direction === 'in' ? 'text-emerald-700' : 'text-gray-900'}`}>
                    {o.direction === 'in' ? '+' : '−'}{Number(o.amount).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2 max-w-[520px]">
                    <div className="text-gray-900 truncate">{o.counterparty || '—'}</div>
                    <div className="text-xs text-gray-500 line-clamp-2">{o.purpose}</div>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      disabled={busy !== null}
                      value={o.category}
                      onChange={(e) => change(o.id, e.target.value as BankCategory, false)}
                      className={`w-full text-sm border rounded-lg px-2 py-1 ${o.category === 'uncategorized' ? 'border-rose-300' : 'border-gray-200'}`}
                    >
                      {BANK_CATEGORIES.map((c) => <option key={c} value={c}>{BANK_CATEGORY_LABEL[c]}</option>)}
                    </select>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                      <span className="text-gray-400 truncate">
                        {o.category_source === 'manual' ? 'вручную' : o.category_source === 'rule' ? `правило: ${o.rule_label || ''}` : 'нет правила'}
                      </span>
                      {o.category !== 'uncategorized' && o.category_source === 'manual' && (
                        <button
                          disabled={busy !== null}
                          onClick={() => change(o.id, o.category, true)}
                          className="text-indigo-600 hover:underline whitespace-nowrap"
                          title="Запомнить: такие операции этого контрагента всегда разносить сюда"
                        >
                          <Icon name="Wand2" size={11} className="inline -mt-0.5" /> запомнить
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BankOperations;
