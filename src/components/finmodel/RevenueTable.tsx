import { useState } from 'react';
import Icon from '@/components/ui/icon';
import {
  RevenueData, SCENARIOS, SCENARIO_LABEL, Scenario, VariablePctSource, fmMoney, fmMonthLabel, fmPct,
} from '@/lib/finmodelApi';

interface Props {
  data: RevenueData;
  active: Scenario;
  onSetPct: (month: string, pct: number | null) => Promise<void>;
}

const SOURCE_LABEL: Record<VariablePctSource, string> = {
  report: 'из отчёта',
  override: 'вручную',
  last: 'прогноз',
};

const SOURCE_STYLE: Record<VariablePctSource, string> = {
  report: 'bg-blue-50 text-blue-700',
  override: 'bg-amber-50 text-amber-700',
  last: 'bg-gray-100 text-gray-600',
};

function PctCell({ month, pct, source, onSave }: {
  month: string;
  pct: number;
  source: VariablePctSource;
  onSave: (month: string, pct: number | null) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(pct).replace('.', ','));
  const [busy, setBusy] = useState(false);

  const save = async (v: number | null) => {
    setBusy(true);
    try {
      await onSave(month, v == null ? null : 100 - v);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center justify-end gap-1">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save(Number(value.replace(',', '.')));
            if (e.key === 'Escape') setEditing(false);
          }}
          className="w-16 px-1.5 py-0.5 border border-gray-300 rounded text-right text-sm"
        />
        <span className="text-gray-400">%</span>
        <button
          disabled={busy || Number.isNaN(Number(value.replace(',', '.')))}
          onClick={() => save(Number(value.replace(',', '.')))}
          className="text-emerald-600 hover:text-emerald-800 disabled:opacity-40"
          title="Сохранить"
        >
          <Icon name={busy ? 'Loader2' : 'Check'} size={16} className={busy ? 'animate-spin' : ''} />
        </button>
        {source === 'override' && (
          <button
            disabled={busy}
            onClick={() => save(null)}
            className="text-gray-400 hover:text-red-600"
            title="Убрать ручное значение"
          >
            <Icon name="RotateCcw" size={14} />
          </button>
        )}
        <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-700" title="Отмена">
          <Icon name="X" size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <span className={`text-[10px] px-1.5 py-0.5 rounded ${SOURCE_STYLE[source]}`}>{SOURCE_LABEL[source]}</span>
      <span className="tabular-nums">{fmPct(pct)}</span>
      {source !== 'report' && (
        <button
          onClick={() => {
            setValue(String(pct).replace('.', ','));
            setEditing(true);
          }}
          className="text-gray-300 hover:text-gray-700"
          title="Задать маржинальность для месяца"
        >
          <Icon name="Pencil" size={13} />
        </button>
      )}
    </div>
  );
}

export default function RevenueTable({ data, active, onSetPct }: Props) {
  const sum = (sc: Scenario, k: 'avans' | 'fact' | 'revenue' | 'variable_amount') =>
    data.forecast.reduce((s, r) => s + (Number(r[sc]?.[k]) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Поступления и переменные расходы · {SCENARIO_LABEL[active]}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Поступления = аванс − {fmPct(data.acquiring_pct)} эквайринга: деньги на карте и база для 10% собственнику.
            Маржинальность берётся из отчёта «Маржинальность урока» (с сентября 2026); для будущих месяцев — последняя
            из отчёта или ваше значение. Переменные расходы = факт × (100% − маржинальность)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Месяц</th>
                <th className="text-right px-4 py-2 font-medium">Аванс</th>
                <th className="text-right px-4 py-2 font-medium">Факт</th>
                <th className="text-right px-4 py-2 font-medium text-emerald-700">Поступления</th>
                <th className="text-right px-4 py-2 font-medium">Маржинальность урока</th>
                <th className="text-right px-4 py-2 font-medium text-rose-700">Переменные</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.forecast.map((r) => {
                const c = r[active];
                return (
                  <tr key={r.month_id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-2 font-medium text-gray-900">{fmMonthLabel(r.month_id)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-gray-600">{fmMoney(c?.avans)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-gray-600">{fmMoney(c?.fact)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-emerald-800">{fmMoney(c?.revenue)}</td>
                    <td className="px-4 py-2 text-right">
                      <PctCell
                        month={r.month_id}
                        pct={100 - Number(r.variable_pct)}
                        source={r.variable_pct_source}
                        onSave={onSetPct}
                      />
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-rose-700">{fmMoney(c?.variable_amount)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold text-gray-900">
              <tr>
                <td className="px-4 py-2">Итого</td>
                <td className="px-4 py-2 text-right tabular-nums">{fmMoney(sum(active, 'avans'))}</td>
                <td className="px-4 py-2 text-right tabular-nums">{fmMoney(sum(active, 'fact'))}</td>
                <td className="px-4 py-2 text-right tabular-nums text-emerald-800">{fmMoney(sum(active, 'revenue'))}</td>
                <td />
                <td className="px-4 py-2 text-right tabular-nums text-rose-700">{fmMoney(sum(active, 'variable_amount'))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Три сценария за 12 месяцев</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Сценарий</th>
              <th className="text-right px-4 py-2 font-medium">Поступления</th>
              <th className="text-right px-4 py-2 font-medium">Переменные</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {SCENARIOS.map((sc) => (
              <tr key={sc} className={sc === active ? 'bg-emerald-50/60 font-semibold' : ''}>
                <td className="px-4 py-2">{SCENARIO_LABEL[sc]}</td>
                <td className="px-4 py-2 text-right tabular-nums">{fmMoney(sum(sc, 'revenue'))}</td>
                <td className="px-4 py-2 text-right tabular-nums">{fmMoney(sum(sc, 'variable_amount'))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}