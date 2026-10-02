import { AvansData, SCENARIOS, SCENARIO_LABEL, Scenario, fmMoney, fmMonthLabel, fmPct } from '@/lib/finmodelApi';

interface Props {
  data: AvansData;
  active: Scenario;
}

export default function AvansForecastTable({ data, active }: Props) {
  const totals = SCENARIOS.reduce(
    (acc, sc) => ({ ...acc, [sc]: data.forecast.reduce((s, r) => s + (r[sc]?.forecast_final || 0), 0) }),
    {} as Record<Scenario, number>,
  );
  const prevTotal = data.forecast.reduce((s, r) => s + (r.avans_prev_year || 0), 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Прогноз авансовых доходов</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Аванс прошлого года × коэффициент роста; при расхождении с сезонным прогнозом больше{' '}
          {fmPct(data.threshold_pct, 0)} — среднее двух
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Месяц</th>
              <th className="text-right px-4 py-2 font-medium">Аванс прошлого года</th>
              {SCENARIOS.map((sc) => (
                <th
                  key={sc}
                  className={`text-right px-4 py-2 font-medium ${sc === active ? 'text-emerald-700 bg-emerald-50' : ''}`}
                >
                  {SCENARIO_LABEL[sc]} ({String(data.coefs[sc]).replace('.', ',')})
                </th>
              ))}
              <th className="text-right px-4 py-2 font-medium">Метод</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.forecast.map((r) => {
              const cell = r[active];
              const averaged = cell && cell.forecast_direct != null && cell.forecast_final !== cell.forecast_direct;
              return (
                <tr key={r.month_id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-2 font-medium text-gray-900">{fmMonthLabel(r.month_id)}</td>
                  <td className="px-4 py-2 text-right text-gray-500 tabular-nums">{fmMoney(r.avans_prev_year)}</td>
                  {SCENARIOS.map((sc) => (
                    <td
                      key={sc}
                      className={`px-4 py-2 text-right tabular-nums ${
                        sc === active ? 'font-semibold text-emerald-800 bg-emerald-50/50' : 'text-gray-700'
                      }`}
                      title={
                        r[sc]
                          ? `Прямой: ${fmMoney(r[sc].forecast_direct)}\nСезонный: ${fmMoney(r[sc].forecast_seasonal)}\nРасхождение: ${fmPct(r[sc].diff_pct)}`
                          : ''
                      }
                    >
                      {fmMoney(r[sc]?.forecast_final)}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right text-xs text-gray-500">
                    {cell?.forecast_direct == null ? 'сезонный' : averaged ? 'среднее' : 'прямой'}
                    {cell?.diff_pct != null && <span className="text-gray-400"> · {fmPct(cell.diff_pct, 1)}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold text-gray-900">
            <tr>
              <td className="px-4 py-2">Итого</td>
              <td className="px-4 py-2 text-right tabular-nums text-gray-600">{fmMoney(prevTotal)}</td>
              {SCENARIOS.map((sc) => (
                <td
                  key={sc}
                  className={`px-4 py-2 text-right tabular-nums ${sc === active ? 'text-emerald-800 bg-emerald-50' : ''}`}
                >
                  {fmMoney(totals[sc])}
                </td>
              ))}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
