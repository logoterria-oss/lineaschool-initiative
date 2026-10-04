import { useState } from 'react';
import { fmMonthLabel } from '@/lib/finmodelApi';
import { BankData, setManualFact } from '@/lib/bankApi';

interface Props {
  data: BankData;
  onChanged: () => Promise<void>;
}

const LINES: [string, string][] = [
  ['start_balance', 'Остаток на начало'],
  ['revenue', 'Поступления'],
  ['variable', 'Переменные'],
  ['fixed', 'Постоянные'],
  ['ano', 'АНО'],
  ['one_time', 'Разовые'],
  ['tax', 'Налог'],
  ['interest', 'Кредит: проценты'],
  ['body', 'Кредит: тело'],
  ['payout', 'Выплата собственнику'],
  ['other', 'Прочее (сальдо)'],
  ['end_balance', 'Остаток на конец'],
];

const addM = (m: string, n: number) => {
  const t = Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7)) - 1 + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
};

const BankManualFacts = ({ data, onChanged }: Props) => {
  const months = Array.from({ length: 6 }, (_, i) => addM(data.fact_from, i - 6));
  const [month, setMonth] = useState(addM(data.fact_from, -1));
  const own = Object.fromEntries(data.manual.filter((r) => r.month_id === month).map((r) => [r.line, String(r.amount)]));
  const [vals, setVals] = useState<Record<string, string>>(own);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const pick = (m: string) => {
    setMonth(m);
    setVals(Object.fromEntries(data.manual.filter((r) => r.month_id === m).map((r) => [r.line, String(r.amount)])));
    setMsg('');
  };
  const n = (s?: string) => (s && s.trim() !== '' ? Number(s.replace(/\s/g, '').replace(',', '.')) : null);
  const calcEnd = () => {
    const sb = n(vals.start_balance);
    if (sb === null) return null;
    const out = ['variable', 'fixed', 'ano', 'one_time', 'tax', 'interest', 'body', 'payout'].reduce((s, k) => s + (n(vals[k]) || 0), 0);
    return sb + (n(vals.revenue) || 0) + (n(vals.other) || 0) - out;
  };
  const end = calcEnd();

  const save = async () => {
    setBusy(true);
    setMsg('');
    try {
      const v: Record<string, number | null> = {};
      for (const [k] of LINES) {
        const x = n(vals[k]);
        if (x !== null && Number.isNaN(x)) throw new Error('Проверьте числа');
        v[k] = x;
      }
      await setManualFact(month, v);
      await onChanged();
      setMsg('Сохранено');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <div className="font-medium text-gray-900">Ручные итоги до {fmMonthLabel(data.fact_from)}</div>
          <div className="text-xs text-gray-500">
            Итоги месяца по строкам Cash Flow. «Остаток на конец» последнего месяца ({fmMonthLabel(addM(data.fact_from, -1))}) станет стартовым остатком модели.
          </div>
        </div>
        <select value={month} onChange={(e) => pick(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5">
          {months.map((m) => <option key={m} value={m}>{fmMonthLabel(m)}</option>)}
        </select>
      </div>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
        {LINES.map(([k, l]) => (
          <label key={k} className="flex items-center gap-2 text-sm">
            <span className={`flex-1 ${k.endsWith('balance') ? 'font-medium text-gray-900' : 'text-gray-600'}`}>{l}</span>
            <input
              value={vals[k] ?? ''}
              onChange={(e) => setVals({ ...vals, [k]: e.target.value })}
              placeholder={k === 'end_balance' && end !== null ? String(Math.round(end * 100) / 100) : '—'}
              className="w-36 text-right border border-gray-200 rounded-lg px-2 py-1 tabular-nums"
            />
          </label>
        ))}
      </div>
      {end !== null && n(vals.end_balance) !== null && Math.abs(end - (n(vals.end_balance) || 0)) > 1 && (
        <div className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          По строкам получается остаток {end.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽, а введено {Number(n(vals.end_balance)).toLocaleString('ru-RU')} ₽ —
          разница {(Number(n(vals.end_balance)) - end).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽. Проверьте строки.
        </div>
      )}
      <div className="flex items-center gap-3">
        <button disabled={busy} onClick={save} className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-50">Сохранить</button>
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
      </div>
    </div>
  );
};

export default BankManualFacts;
