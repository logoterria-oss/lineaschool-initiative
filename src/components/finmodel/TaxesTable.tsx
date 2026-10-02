import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { SCENARIO_LABEL, Scenario, TaxData, TaxRegime, fmMonthLabel } from '@/lib/finmodelApi';

interface Props {
  data: TaxData;
  active: Scenario;
  onRegime: (month: string, regime: TaxRegime | null) => Promise<void>;
}

const REGIME: Record<TaxRegime, { label: string; cls: string }> = {
  usn: { label: 'УСН 6%', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  patent: { label: 'Патент', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
};

const rub = (v: number, d = 2) =>
  `${Number(v).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: d })} ₽`;

const TaxesTable = ({ data, active, onRegime }: Props) => {
  const [busy, setBusy] = useState<string | null>(null);
  const p = data.params;
  const totals = data.rows.reduce(
    (a, r) => {
      const v = r.values[active];
      return { gross: a.gross + v.tax_gross, net: a.net + v.tax_net, red: a.red + v.reduction };
    },
    { gross: 0, net: 0, red: 0 },
  );
  const cmp = data.compare[active];

  const toggle = async (month: string, current: TaxRegime, def: TaxRegime) => {
    const next: TaxRegime = current === 'usn' ? 'patent' : 'usn';
    setBusy(month);
    try {
      await onRegime(month, next === def ? null : next);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-lg font-semibold text-gray-900">Налоги</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          До {fmMonthLabel(p.start_patent_month)} — УСН «Доходы» {p.usn_pct}% от аванса, с {fmMonthLabel(p.start_patent_month)} — патент{' '}
          {rub(p.patent_year)}/год ({rub(p.patent_monthly)}/мес). Налог уменьшается на взносы в Соцфонд, но не больше чем на{' '}
          {p.max_deduction_pct}%: <span className="font-mono text-gray-700">max(исходный − СФ, исходный × 50%)</span>.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-xs text-gray-500">Налог итог за период</div>
            <div className="text-lg font-bold text-gray-900">{rub(totals.net, 0)}</div>
            <div className="text-[11px] text-gray-400">{SCENARIO_LABEL[active]}</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-xs text-gray-500">Уменьшение на взносы</div>
            <div className="text-lg font-bold text-emerald-700">−{rub(totals.red, 0)}</div>
            <div className="text-[11px] text-gray-400">из {rub(totals.gross, 0)} исходного</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-xs text-gray-500">Взносы ИП за себя</div>
            <div className="text-lg font-bold text-gray-900">{rub(p.self_monthly)}/мес</div>
            <div className="text-[11px] text-amber-600">{rub(p.self_year, 0)}/год — уточнить</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-xs text-gray-500">График оплаты патента</div>
            <div className="text-sm font-semibold text-gray-900 mt-1">{p.patent_schedule || '—'}</div>
            <div className="text-[11px] text-amber-600">в расчёте — равномерно по месяцам, уточнить</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="font-medium text-gray-900">Налог по месяцам · {SCENARIO_LABEL[active]}</div>
          <div className="text-xs text-gray-500">Нажмите на режим, чтобы переключить его для месяца. СФ = страховые 30% за наёмных + взносы ИП за себя.</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Месяц</th>
                <th className="text-left px-4 py-2 font-medium">Режим</th>
                <th className="text-right px-4 py-2 font-medium">База</th>
                <th className="text-right px-4 py-2 font-medium">Налог исходный</th>
                <th className="text-right px-4 py-2 font-medium">СФ</th>
                <th className="text-right px-4 py-2 font-medium">Уменьшение</th>
                <th className="text-right px-4 py-2 font-medium">Налог итог</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => {
                const v = r.values[active];
                const rg = REGIME[r.regime];
                return (
                  <tr key={r.month_id} className={`border-t border-gray-100 ${r.month_id === data.current_month ? 'bg-emerald-50/50' : ''}`}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {fmMonthLabel(r.month_id)}
                      {r.month_id === data.current_month && <span className="ml-2 text-[10px] text-emerald-600">текущий</span>}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <button
                        disabled={busy === r.month_id}
                        onClick={() => toggle(r.month_id, r.regime, r.regime_default)}
                        className={`text-xs px-2 py-0.5 rounded border ${rg.cls} hover:opacity-80 disabled:opacity-50`}
                        title="Переключить режим"
                      >
                        {busy === r.month_id ? <Icon name="Loader2" size={12} className="animate-spin inline" /> : rg.label}
                      </button>
                      {r.source === 'override' && <span className="ml-1.5 text-[10px] text-amber-600">вручную</span>}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-gray-600">
                      {rub(v.base, 0)}
                      {r.regime === 'usn' && (
                        <div className="text-[10px] text-gray-400">{r.avans_source === 'fact' ? 'факт аванса' : 'прогноз аванса'}</div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{rub(v.tax_gross)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-gray-600" title={`Наёмные ${rub(v.sf_employees)} + ИП ${rub(v.sf_self)}`}>
                      {rub(v.social_fund)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-emerald-700">
                      −{rub(v.reduction)}
                      {v.limited && <div className="text-[10px] text-gray-400">упор в 50%</div>}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-semibold">{rub(v.tax_net)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr className="border-t border-gray-200">
                <td className="px-4 py-2" colSpan={3}>Итого</td>
                <td className="px-4 py-2 text-right tabular-nums">{rub(totals.gross, 0)}</td>
                <td />
                <td className="px-4 py-2 text-right tabular-nums text-emerald-700">−{rub(totals.red, 0)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{rub(totals.net, 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {data.compare_months && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="font-medium text-gray-900">Что выгоднее за {fmMonthLabel(data.compare_months[0])} – {fmMonthLabel(data.compare_months[1])}</div>
          <div className="text-xs text-gray-500 mb-3">Если бы весь период был на одном режиме · {SCENARIO_LABEL[active]}</div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg bg-sky-50 p-3">
              <div className="text-xs text-sky-700">Только УСН</div>
              <div className="text-lg font-bold text-gray-900">{rub(cmp.usn, 0)}</div>
            </div>
            <div className="rounded-lg bg-violet-50 p-3">
              <div className="text-xs text-violet-700">Только патент</div>
              <div className="text-lg font-bold text-gray-900">{rub(cmp.patent, 0)}</div>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3">
              <div className="text-xs text-emerald-700">{cmp.patent <= cmp.usn ? 'Патент выгоднее на' : 'УСН выгоднее на'}</div>
              <div className="text-lg font-bold text-emerald-800">{rub(Math.abs(cmp.usn - cmp.patent), 0)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxesTable;
