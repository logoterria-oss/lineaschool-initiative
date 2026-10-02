import {
  FactData, SCENARIOS, SCENARIO_LABEL, Scenario, fmCoef, fmMoney, fmMonthLabel, fmPct,
} from '@/lib/finmodelApi';

interface Props {
  data: FactData;
  active: Scenario;
}

export default function FactForecastTable({ data, active }: Props) {
  const totals = SCENARIOS.reduce(
    (acc, sc) => ({ ...acc, [sc]: data.forecast.reduce((s, r) => s + (r[sc]?.fact_final || 0), 0) }),
    {} as Record<Scenario, number>,
  );
  const prevTotal = data.forecast.reduce((s, r) => s + (r.fact_prev_year || 0), 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Прогноз фактических доходов</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Прогноз аванса × коэф. факт/аванс того же месяца; если сезонный контроль расходится больше чем на{' '}
          {fmPct(data.threshold_pct, 0)} — среднее двух. Ручной ввод не предусмотрен.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Месяц</th>
              <th className="text-right px-4 py-2 font-medium">Факт прошлого года</th>
              <th className="text-right px-4 py-2 font-medium">Коэф. факт/аванс</th>
              {SCENARIOS.map((sc) => (
                <th
                  key={sc}
                  className={`text-right px-4 py-2 font-medium ${sc === active ? 'text-indigo-700 bg-indigo-50' : ''}`}
                >
                  {SCENARIO_LABEL[sc]}
                </th>
              ))}
              <th className="text-right px-4 py-2 font-medium">Метод</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.forecast.map((r) => {
              const cell = r[active];
              const averaged = cell && cell.fact_final !== cell.fact_direct;
              return (
                <tr key={r.month_id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-2 font-medium text-gray-900">{fmMonthLabel(r.month_id)}</td>
                  <td className="px-4 py-2 text-right text-gray-500 tabular-nums">{fmMoney(r.fact_prev_year)}</td>
                  <td
                    className={`px-4 py-2 text-right tabular-nums ${Number(r.coef) > 1 ? 'text-amber-700' : 'text-gray-600'}`}
                  >
                    {fmCoef(r.coef)}
                  </td>
                  {SCENARIOS.map((sc) => (
                    <td
                      key={sc}
                      className={`px-4 py-2 text-right tabular-nums ${
                        sc === active ? 'font-semibold text-indigo-800 bg-indigo-50/50' : 'text-gray-700'
                      }`}
                      title={
                        r[sc]
                          ? `Прогноз аванса: ${fmMoney(r[sc].avans_forecast)}\nПрямой: ${fmMoney(r[sc].fact_direct)}\nСезонный: ${fmMoney(r[sc].fact_seasonal)}\nРасхождение: ${fmPct(r[sc].diff_pct)}`
                          : ''
                      }
                    >
                      {fmMoney(r[sc]?.fact_final)}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right text-xs text-gray-500">
                    {averaged ? 'среднее' : 'прямой'}
                    {cell && <span className="text-gray-400"> · {fmPct(cell.diff_pct, 1)}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold text-gray-900">
            <tr>
              <td className="px-4 py-2">Итого</td>
              <td className="px-4 py-2 text-right tabular-nums text-gray-600">{fmMoney(prevTotal)}</td>
              <td />
              {SCENARIOS.map((sc) => (
                <td
                  key={sc}
                  className={`px-4 py-2 text-right tabular-nums ${sc === active ? 'text-indigo-800 bg-indigo-50' : ''}`}
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
