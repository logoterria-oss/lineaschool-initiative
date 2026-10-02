import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { AnoData, AnoRow, fmMoney, fmMonthLabel } from '@/lib/finmodelApi';

interface Props {
  data: AnoData;
  onSave: (month: string, v: { monthly?: number | null; extra?: number | null; note?: string }) => Promise<void>;
}

const toNum = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.'));

function RowEditor({ row, onSave, onClose }: { row: AnoRow; onSave: Props['onSave']; onClose: () => void }) {
  const [monthly, setMonthly] = useState(String(row.monthly));
  const [extra, setExtra] = useState(String(row.extra_one_time));
  const [note, setNote] = useState(row.note);
  const [busy, setBusy] = useState(false);
  const bad = [monthly, extra].some((v) => v.trim() === '' || Number.isNaN(toNum(v)) || toNum(v) < 0);

  const run = async (v: Parameters<Props['onSave']>[1]) => {
    setBusy(true);
    try {
      await onSave(row.month_id, v);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const input = 'w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm';
  return (
    <tr className="bg-amber-50/40 border-t border-gray-100">
      <td className="px-4 py-2 font-medium">{fmMonthLabel(row.month_id)}</td>
      <td className="px-4 py-2 text-right">
        <div className="text-xs text-gray-500 mb-1">по графику {fmMoney(row.one_time_schedule)} +</div>
        <input className={input} value={extra} onChange={(e) => setExtra(e.target.value)} inputMode="numeric" title="Доп. разовый платёж" />
      </td>
      <td className="px-4 py-2 text-right">
        <input className={input} value={monthly} onChange={(e) => setMonthly(e.target.value)} inputMode="numeric" />
      </td>
      <td className="px-4 py-2" colSpan={2}>
        <div className="flex flex-col gap-1.5 items-end">
          <input
            className="w-full max-w-[220px] px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="Комментарий (за что платёж)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              disabled={bad || busy}
              onClick={() => run({ monthly: toNum(monthly), extra: toNum(extra), note })}
              className="px-3 py-1 rounded bg-gray-900 text-white text-xs disabled:opacity-40"
            >
              {busy ? 'Сохраняем…' : 'Сохранить'}
            </button>
            {row.source === 'manual' && (
              <button
                disabled={busy}
                onClick={() => run({ monthly: null, extra: 0, note: '' })}
                className="px-3 py-1 rounded border border-gray-300 text-xs text-gray-600"
              >
                По графику
              </button>
            )}
            <button onClick={onClose} className="px-3 py-1 rounded border border-gray-300 text-xs text-gray-600">Отмена</button>
          </div>
        </div>
      </td>
    </tr>
  );
}

const AnoTable = ({ data, onSave }: Props) => {
  const [edit, setEdit] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const p = data.params;
  const s = data.summary;
  const end = s.period?.[1];
  const rows = showAll || !end ? data.rows : data.rows.filter((r) => r.month_id <= end);
  const tot = rows.reduce(
    (a, r) => ({ one: a.one + r.one_time, mon: a.mon + r.monthly, all: a.all + r.total }),
    { one: 0, mon: 0, all: 0 },
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-lg font-semibold text-gray-900">АНО</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Отдельная организация, которую первое время обеспечивает ИП. Расходы входят в модель школы отдельной строкой
          (P&L и Cash Flow) и не участвуют в переменных расходах.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {[
            ['Открытие, разово', fmMoney(p.one_time_total), `${fmMoney(p.one_time_sep)} сен + ${fmMoney(p.one_time_oct)} окт 2026`],
            ['Бухгалтер АНО', `${fmMoney(p.monthly)}/мес`, `с ${fmMonthLabel(p.start_monthly)}`],
            ['Ежемесячно за период', fmMoney(s.monthly), `${s.monthly_count} мес`],
            ['Всего за период', fmMoney(s.total), s.period ? `${fmMonthLabel(s.period[0])} – ${fmMonthLabel(s.period[1])}` : ''],
          ].map(([l, v, sub]) => (
            <div key={l} className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">{l}</div>
              <div className="text-lg font-bold text-gray-900">{v}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
          <div>
            <div className="font-medium text-gray-900">График платежей</div>
            <div className="text-xs text-gray-500">Нажмите на строку, чтобы изменить ежемесячный платёж или добавить разовый</div>
          </div>
          <label className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer whitespace-nowrap">
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
            Весь горизонт
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Месяц</th>
                <th className="text-right px-4 py-2 font-medium">Разово</th>
                <th className="text-right px-4 py-2 font-medium">Ежемесячно</th>
                <th className="text-right px-4 py-2 font-medium">Итого</th>
                <th className="text-left px-4 py-2 font-medium">Источник</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) =>
                edit === r.month_id ? (
                  <RowEditor key={r.month_id} row={r} onSave={onSave} onClose={() => setEdit(null)} />
                ) : (
                  <tr
                    key={r.month_id}
                    onClick={() => setEdit(r.month_id)}
                    className={`border-t border-gray-100 cursor-pointer hover:bg-gray-50 ${r.month_id === data.current_month ? 'bg-emerald-50/50' : ''}`}
                  >
                    <td className="px-4 py-2">
                      {fmMonthLabel(r.month_id)}
                      {r.month_id === data.current_month && <span className="ml-2 text-[10px] text-emerald-600">текущий</span>}
                      {r.note && <div className="text-[11px] text-gray-400">{r.note}</div>}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmMoney(r.one_time)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmMoney(r.monthly)}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium">{fmMoney(r.total)}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${r.source === 'manual' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                        {r.source === 'manual' ? 'вручную' : 'график'}
                      </span>
                      <Icon name="Pencil" size={12} className="inline ml-2 text-gray-300" />
                    </td>
                  </tr>
                ),
              )}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr className="border-t border-gray-200">
                <td className="px-4 py-2">Итого</td>
                <td className="px-4 py-2 text-right tabular-nums">{fmMoney(tot.one)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{fmMoney(tot.mon)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{fmMoney(tot.all)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnoTable;
