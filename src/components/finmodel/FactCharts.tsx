import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  AvansData, FactData, MONTH_NUM_LABEL, Scenario, SCENARIO_LABEL, fmCoef, fmMoney, fmMonthLabel, fmPct,
} from '@/lib/finmodelApi';

interface Props {
  fact: FactData;
  avans: AvansData;
  active: Scenario;
}

const kRub = (v: number) => `${Math.round(v / 1000)}к`;

export default function FactCharts({ fact, avans, active }: Props) {
  const avansFc = Object.fromEntries(avans.forecast.map((r) => [r.month_id, r[active]?.forecast_final]));
  const flow = [
    ...fact.history
      .filter((h) => h.closed)
      .map((h) => ({ month: fmMonthLabel(h.month_id), avans: Number(h.avans) || 0, fact: Number(h.fact), forecast: false })),
    ...fact.forecast.map((r) => ({
      month: fmMonthLabel(r.month_id),
      avans: Number(avansFc[r.month_id]) || 0,
      fact: Number(r[active]?.fact_final) || 0,
      forecast: true,
    })),
  ];
  const firstForecast = flow.find((r) => r.forecast)?.month;

  const coefs = fact.coefs.map((c) => ({ month: MONTH_NUM_LABEL[c.month_num - 1], coef: Number(c.coef), num: c.month_num }));
  const seasonOrder = [...fact.seasonality].sort((a, b) => ((a.month_num + 2) % 12) - ((b.month_num + 2) % 12));
  const coefOrder = [...coefs].sort((a, b) => ((a.num + 2) % 12) - ((b.num + 2) % 12));
  const seasons = seasonOrder.map((s) => ({
    month: MONTH_NUM_LABEL[s.month_num - 1],
    avans: Number(s.avans_share_pct),
    fact: Number(s.share_pct),
  }));
  const period = fact.coefs[0]?.source_period || '';

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900">Авансы и факт по месяцам</h3>
        <p className="text-xs text-gray-500 mb-3">
          Аванс — пришедшие деньги, факт — проведённые уроки. Справа от линии — прогноз ({SCENARIO_LABEL[active]})
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={flow} margin={{ left: 0, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} interval={1} />
            <YAxis tickFormatter={kRub} tick={{ fontSize: 11 }} width={48} />
            <Tooltip formatter={(v: number) => fmMoney(v)} />
            <Legend />
            {firstForecast && <ReferenceLine x={firstForecast} stroke="#9ca3af" strokeDasharray="4 4" />}
            <Bar dataKey="avans" name="Аванс" fill="#10b981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="fact" name="Факт" fill="#6366f1" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900">Коэффициент факт/аванс</h3>
          <p className="text-xs text-gray-500 mb-3">Окно: {period}. Выше 1 — отходили больше, чем оплатили в этом месяце</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={coefOrder} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 'auto']} tick={{ fontSize: 11 }} width={36} tickFormatter={(v) => fmCoef(v, 1)} />
              <Tooltip formatter={(v: number) => fmCoef(v)} />
              <ReferenceLine y={1} stroke="#f59e0b" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="coef" name="Коэф." stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900">Сезонные доли: аванс и факт</h3>
          <p className="text-xs text-gray-500 mb-3">
            Доля месяца в годовой сумме. Сумма долей факта: {fmPct(fact.seasonality_total_pct)}
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={seasons} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={36} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: number) => fmPct(v)} />
              <Legend />
              <Bar dataKey="avans" name="Аванс" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="fact" name="Факт" fill="#6366f1" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">История факта и коэффициенты</h3>
          <p className="text-xs text-gray-500 mt-0.5">Закрытые месяцы не меняются. Коэффициенты пересчитываются автоматически</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Месяц</th>
                <th className="text-right px-4 py-2 font-medium">Аванс</th>
                <th className="text-right px-4 py-2 font-medium">Факт</th>
                <th className="text-right px-4 py-2 font-medium">Факт/аванс</th>
                <th className="text-right px-4 py-2 font-medium">Доля факта</th>
                <th className="text-right px-4 py-2 font-medium">Источник</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fact.history.map((h) => {
                const s = fact.seasonality.find((x) => x.month_num === Number(h.month_id.slice(5)));
                const inWindow = s && !h.exclude_from_seasonality && Number(s.fact) === Number(h.fact);
                return (
                  <tr key={h.month_id} className={h.exclude_from_seasonality ? 'text-gray-400' : ''}>
                    <td className="px-4 py-2 font-medium">{fmMonthLabel(h.month_id)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmMoney(h.avans)}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-semibold">{fmMoney(h.fact)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {h.avans ? fmCoef(Number(h.fact) / Number(h.avans)) : '—'}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{inWindow ? fmPct(s.share_pct) : '—'}</td>
                    <td className="px-4 py-2 text-right text-xs" title={h.note}>
                      {h.source === 'report' ? 'отчёт' : 'история'}
                      {h.exclude_from_seasonality && ' · вне сезонности'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
