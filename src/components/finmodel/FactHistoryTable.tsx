import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { HistoryData, fetchHistory, fmMonthLabel } from '@/lib/finmodelApi';

interface Props {
  kind: 'pnl' | 'cashflow';
}

type Kind = 'income' | 'cost' | 'subtotal' | 'total' | 'balance';

const PNL_LINES: [string, string, Kind][] = [
  ['revenue', 'Выручка (проведённые занятия)', 'income'],
  ['interest_income', 'Проценты по депозиту', 'income'],
  ['acquiring', 'Комиссии за приём оплат', 'cost'],
  ['teachers', 'Педагоги', 'cost'],
  ['teacher_transfer_fees', 'Комиссия за переводы самозанятым', 'cost'],
  ['methodists', 'Дизайнеры метод.материалов', 'cost'],
  ['ruo', 'Руководитель учебного отдела', 'cost'],
  ['admin', 'Администратор', 'cost'],
  ['developer', 'Разработчик', 'cost'],
  ['advertising', 'Реклама', 'cost'],
  ['software_site', 'ПО: сайт', 'cost'],
  ['software_lessons', 'ПО: ведение уроков', 'cost'],
  ['software_other', 'ПО: прочее', 'cost'],
  ['cash_register', 'Касса', 'cost'],
  ['banking', 'Банкинг и связь', 'cost'],
  ['bank_fees', 'Комиссии банка', 'cost'],
  ['one_time', 'Разовые', 'cost'],
  ['pretax_profit', 'Прибыль до налогов', 'subtotal'],
  ['tax_usn', 'Налог УСН', 'cost'],
  ['owner_insurance', 'Взносы ИП за себя', 'cost'],
  ['net_profit', 'Чистая прибыль', 'total'],
];

const CF_LINES: [string, string, Kind][] = [
  ['start_balance', 'Остаток на начало', 'balance'],
  ['revenue', 'Поступления от учеников', 'income'],
  ['variable', 'Переменные расходы', 'cost'],
  ['fixed', 'Постоянные расходы', 'cost'],
  ['ano', 'Расходы АНО', 'cost'],
  ['one_time', 'Разовые расходы', 'cost'],
  ['tax', 'Налоги и взносы', 'cost'],
  ['interest', 'Кредит: проценты', 'cost'],
  ['body', 'Кредит: тело', 'cost'],
  ['payout', 'Выплата собственнику', 'cost'],
  ['other', 'Прочее (сальдо)', 'income'],
  ['end_balance', 'Остаток на конец', 'total'],
];

const num = (v: number) => Math.round(v).toLocaleString('ru-RU');

const FactHistoryTable = ({ kind }: Props) => {
  const [data, setData] = useState<HistoryData | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<{ m: string; l: string } | null>(null);

  useEffect(() => {
    fetchHistory().then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'));
  }, []);

  if (error) return <div className="bg-white rounded-xl border border-gray-200 p-5 text-sm text-rose-600">{error}</div>;
  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
        <Icon name="Loader2" size={20} className="animate-spin mx-auto mb-1" /> Загружаем факт прошлых месяцев…
      </div>
    );
  }

  const rows = kind === 'pnl' ? data.pnl : data.cashflow;
  const map: Record<string, Record<string, { amount: number; note: string }>> = {};
  rows.forEach((r) => {
    (map[r.month_id] ||= {})[r.line] = { amount: Number(r.amount), note: r.note };
  });
  const months = Object.keys(map)
    .filter((m) => Object.values(map[m]).some((c) => c.amount !== 0))
    .sort();
  if (!months.length) return null;

  const lines = (kind === 'pnl' ? PNL_LINES : CF_LINES).filter(([k]) => months.some((m) => map[m][k] && map[m][k].amount !== 0));
  const note = open ? map[open.m]?.[open.l]?.note : '';
  const openLabel = open ? lines.find(([k]) => k === open.l)?.[1] : '';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <div className="font-medium text-gray-900">
          {kind === 'pnl' ? 'P&L — факт' : 'Cash Flow — факт по банку'} · {fmMonthLabel(months[0])} – {fmMonthLabel(months[months.length - 1])}
        </div>
        <div className="text-xs text-gray-500">Нажмите на сумму, чтобы увидеть, из чего она сложилась.</div>
      </div>
      <div className="overflow-x-auto">
        <table className="text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="sticky left-0 bg-gray-50 text-left px-4 py-2 font-medium min-w-[230px] z-10">Статья</th>
              {months.map((m) => (
                <th key={m} className="text-right px-4 py-2 font-medium whitespace-nowrap">{fmMonthLabel(m)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map(([k, label, t]) => {
              const strong = t === 'subtotal' || t === 'total' || t === 'balance';
              const rowCls = t === 'total' ? 'bg-emerald-50/60 font-bold' : strong ? 'bg-gray-50 font-semibold' : '';
              return (
                <tr key={k} className={`border-t border-gray-100 ${rowCls}`}>
                  <td className={`sticky left-0 px-4 py-2 z-10 ${t === 'total' ? 'bg-emerald-50' : strong ? 'bg-gray-50' : 'bg-white'}`}>
                    {t === 'cost' && <span className="text-gray-400 mr-1">−</span>}
                    {label}
                  </td>
                  {months.map((m) => {
                    const c = map[m][k];
                    const active = open?.m === m && open?.l === k;
                    return (
                      <td key={m} className="px-2 py-1 text-right tabular-nums whitespace-nowrap">
                        {c ? (
                          <button
                            onClick={() => setOpen(active ? null : { m, l: k })}
                            className={`px-2 py-1 rounded-md ${active ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-gray-100'} ${
                              t === 'cost' ? 'text-gray-600' : strong && c.amount < 0 ? 'text-rose-600' : ''
                            } ${c.note ? 'underline decoration-dotted decoration-gray-300 underline-offset-4' : ''}`}
                          >
                            {c.amount === 0 && t === 'cost' ? <span className="text-gray-300">0</span> : num(c.amount)}
                          </button>
                        ) : (
                          <span className="px-2 text-gray-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {open && (
        <div className="border-t border-gray-100 bg-indigo-50/50 px-5 py-3 text-sm">
          <div className="font-medium text-gray-900">{openLabel} · {fmMonthLabel(open.m)}</div>
          <div className="text-gray-700 mt-1 whitespace-pre-line">{note || 'Без пояснения'}</div>
        </div>
      )}
    </div>
  );
};

export default FactHistoryTable;