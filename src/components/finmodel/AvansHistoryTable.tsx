import { AvansData, fmMoney, fmMonthLabel, fmPct } from '@/lib/finmodelApi';

interface Props {
  data: AvansData;
}

/** Фактические авансы по месяцам + рассчитанная из них сезонность. */
export default function AvansHistoryTable({ data }: Props) {
  const share = new Map(data.seasonality.map((s) => [s.month_num, s]));
  const period = data.seasonality[0]?.source_period;
  const windowSum = data.seasonality.reduce((s, r) => s + Number(r.avans), 0);
  const inWindow = (m: string) => {
    const s = share.get(Number(m.slice(5)));
    return !!s && Number(s.avans) > 0;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Фактические авансы и сезонность</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Сезонность считается автоматически по последним 12 закрытым месяцам
          {period ? ` (${period})` : ''}. Ручное редактирование запрещено.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Месяц</th>
              <th className="text-right px-4 py-2 font-medium">Авансовые доходы</th>
              <th className="text-left px-4 py-2 font-medium">Источник</th>
              <th className="text-right px-4 py-2 font-medium">Доля в году</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.history.map((h) => {
              const s = share.get(Number(h.month_id.slice(5)));
              const counted =
                !h.exclude_from_seasonality && inWindow(h.month_id) && s && Number(s.avans) === Number(h.avans);
              return (
                <tr key={h.month_id} className={h.exclude_from_seasonality ? 'text-gray-400' : ''}>
                  <td className="px-4 py-2 font-medium">{fmMonthLabel(h.month_id)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{fmMoney(h.avans)}</td>
                  <td className="px-4 py-2 text-xs">
                    {h.source === 'report' ? (
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700">отчёт</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600">история</span>
                    )}
                    {h.exclude_from_seasonality && <span className="ml-2">не в сезонности</span>}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {counted ? fmPct(Number(s!.share_pct)) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold text-gray-900">
            <tr>
              <td className="px-4 py-2">Итого за 12 мес</td>
              <td className="px-4 py-2 text-right tabular-nums">{fmMoney(windowSum)}</td>
              <td />
              <td className="px-4 py-2 text-right tabular-nums">{fmPct(data.seasonality_total_pct)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
