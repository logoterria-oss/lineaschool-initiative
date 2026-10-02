import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { CreditData, CreditOption, fmMoney, fmMonthLabel } from '@/lib/finmodelApi';

interface Props {
  data: CreditData;
  onOption: (opt: CreditOption) => Promise<void>;
}

const OPTION_LABEL: Record<CreditOption, string> = { '6m': '6 месяцев', '12m': '12 месяцев' };

const CreditTable = ({ data, onOption }: Props) => {
  const [option, setOption] = useState<CreditOption>(data.option);
  const [showClosed, setShowClosed] = useState(false);
  const rows = data.schedules[option];
  const sum = data.summary[option];
  const s6 = data.summary['6m'];
  const s12 = data.summary['12m'];
  const visible = showClosed ? rows : rows.filter((r) => r.status === 'active');
  const p = data.params;

  const pick = async (opt: CreditOption) => {
    setOption(opt);
    try {
      await onOption(opt);
    } catch {
      setOption(data.option);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Оборотный кредит</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Договор {p.contract || '—'} · {fmMoney(p.total)} · {p.rate_pct.toString().replace('.', ',')}% в мес от первоначальной суммы
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            {(['6m', '12m'] as CreditOption[]).map((o) => (
              <button
                key={o}
                onClick={() => pick(o)}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  option === o ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white'
                }`}
              >
                {OPTION_LABEL[o]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
          {[
            ['Платёж в месяц', fmMoney(sum.monthly), 'text-gray-900'],
            ['Проценты за период', fmMoney(sum.interest), 'text-rose-700'],
            ['Тело', fmMoney(sum.body), 'text-gray-900'],
            ['Всего выплат', fmMoney(sum.total), 'text-gray-900'],
            ['Закрытие', sum.close_month ? fmMonthLabel(sum.close_month) : '—', 'text-emerald-700'],
          ].map(([l, v, cls]) => (
            <div key={l} className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">{l}</div>
              <div className={`text-lg font-bold ${cls}`}>{v}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Проценты {fmMoney(p.interest_monthly)}/мес фиксированные и не уменьшаются при погашении тела — платятся, пока кредит не закрыт.
          Первый платёж — {fmMonthLabel(p.start_month)}.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="font-medium text-gray-900">График платежей · {OPTION_LABEL[option]}</div>
          <label className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />
            Показать месяцы после закрытия
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Месяц</th>
                <th className="text-right px-4 py-2 font-medium">Проценты</th>
                <th className="text-right px-4 py-2 font-medium">Тело</th>
                <th className="text-right px-4 py-2 font-medium">Итого</th>
                <th className="text-right px-4 py-2 font-medium">Остаток тела</th>
                <th className="text-left px-4 py-2 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const isCur = r.month_id === data.current_month;
                return (
                  <tr key={r.month_id} className={`border-t border-gray-100 ${r.status === 'closed' ? 'text-gray-400' : ''} ${isCur ? 'bg-emerald-50/50' : ''}`}>
                    <td className="px-4 py-2 capitalize">{fmMonthLabel(r.month_id)}{isCur && <span className="ml-2 text-[10px] text-emerald-600">текущий</span>}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmMoney(r.interest)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmMoney(r.body)}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium">{fmMoney(r.total)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-gray-500">{fmMoney(r.balance_after)}</td>
                    <td className="px-4 py-2">
                      {r.status === 'active' ? (
                        <span className={`text-xs px-2 py-0.5 rounded ${r.is_last ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                          {r.is_last ? 'последний платёж' : 'платёж'}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">закрыт</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr className="border-t border-gray-200">
                <td className="px-4 py-2">Итого</td>
                <td className="px-4 py-2 text-right tabular-nums">{fmMoney(sum.interest)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{fmMoney(sum.body)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{fmMoney(sum.total)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 font-medium text-gray-900">Сравнение вариантов</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Параметр</th>
              <th className="text-right px-4 py-2 font-medium">6 месяцев</th>
              <th className="text-right px-4 py-2 font-medium">12 месяцев</th>
              <th className="text-right px-4 py-2 font-medium">Разница</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Проценты', s6.interest, s12.interest, data.diff.interest],
              ['Тело', s6.body, s12.body, s12.body - s6.body],
              ['Итого', s6.total, s12.total, data.diff.total],
              ['Платёж в месяц', s6.monthly, s12.monthly, data.diff.monthly],
            ].map(([l, a, b, d]) => (
              <tr key={l as string} className="border-t border-gray-100">
                <td className="px-4 py-2">{l}</td>
                <td className="px-4 py-2 text-right tabular-nums">{fmMoney(a as number)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{fmMoney(b as number)}</td>
                <td className={`px-4 py-2 text-right tabular-nums font-medium ${(d as number) > 0 ? 'text-rose-600' : (d as number) < 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {(d as number) > 0 ? '+' : (d as number) < 0 ? '−' : ''}{fmMoney(Math.abs(d as number))}
                </td>
              </tr>
            ))}
            <tr className="border-t border-gray-100">
              <td className="px-4 py-2">Закрытие</td>
              <td className="px-4 py-2 text-right capitalize">{s6.close_month ? fmMonthLabel(s6.close_month) : '—'}</td>
              <td className="px-4 py-2 text-right capitalize">{s12.close_month ? fmMonthLabel(s12.close_month) : '—'}</td>
              <td className="px-4 py-2 text-right text-gray-400">—</td>
            </tr>
          </tbody>
        </table>
        <div className="px-5 py-3 bg-emerald-50 text-sm text-emerald-800 border-t border-emerald-100">
          Закрыть за 6 месяцев выгоднее на <b>{fmMoney(data.diff.interest)}</b> (экономия на процентах), но платёж в месяц выше на{' '}
          <b>{fmMoney(Math.abs(data.diff.monthly))}</b>.
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-sm text-amber-900">
        <Icon name="TriangleAlert" size={18} className="shrink-0 mt-0.5" />
        <div>
          <div className="font-medium">Риск: штраф за просрочку — {fmMoney(data.penalty_risk.amount)} за каждые {data.penalty_risk.period_days} дней</div>
          <div className="text-amber-800/80 mt-0.5">
            {fmMoney(data.penalty_risk.fee)} + 1% от первоначальной суммы ({fmMoney(data.penalty_risk.pct_part)}) при неоплате регулярного платежа.
            Только справочно — в расчёт модели не входит.
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditTable;
