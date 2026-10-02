import { useState } from 'react';
import Icon from '@/components/ui/icon';
import {
  FixedCellSource, FixedData, FixedRow, SCENARIO_LABEL, Scenario, fmMoney, fmMonthLabel,
} from '@/lib/finmodelApi';

export interface FixedHandlers {
  onExpense: (month: string, id: string, amount: number | null) => Promise<void>;
  onInputs: (month: string, v: Record<string, number | null>) => Promise<void>;
  onStaffMonth: (staffId: string, month: string, rate: number | null) => Promise<void>;
  onStaffRate: (staffId: string, rate: number) => Promise<void>;
}

interface Props extends FixedHandlers {
  data: FixedData;
  active: Scenario;
}

const ROW_SOURCE: Record<string, { label: string; cls: string }> = {
  staff: { label: 'Справочник', cls: 'bg-blue-50 text-blue-700' },
  calc: { label: 'Расчёт', cls: 'bg-violet-50 text-violet-700' },
  fixed: { label: 'Справочник', cls: 'bg-blue-50 text-blue-700' },
  manual: { label: 'Ручной ввод', cls: 'bg-amber-50 text-amber-700' },
};

const CELL_HINT: Partial<Record<FixedCellSource, { label: string; cls: string }>> = {
  override: { label: 'разовая', cls: 'text-amber-600' },
  manual: { label: 'вручную', cls: 'text-amber-600' },
  default: { label: 'по умолч.', cls: 'text-gray-400' },
  fact: { label: 'факт аванса', cls: 'text-blue-500' },
  forecast: { label: 'прогноз', cls: 'text-gray-400' },
  adapted: { label: 'адаптация', cls: 'text-violet-600' },
};

const STAFF_BY_ROW: Record<string, string> = {
  ruo_salary: 'ruo_zinchenko',
  accountant: 'accountant',
  targetologist: 'targetologist',
  developer: 'developer',
};

const RATE_UNIT: Record<string, string> = {
  rub_month: '₽/мес', rub_shift: '₽/смена', rub_slide: '₽/слайд', rub_lesson: '₽/урок',
};
const TYPE_LABEL: Record<string, string> = {
  hired: 'найм', informal: 'в чёрную', contractor: 'подрядчик', self_employed: 'самозанятый',
};

const toNum = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.'));

function Editor({ fields, onSave, onReset, onClose }: {
  fields: { key: string; label: string; value: number }[];
  onSave: (v: Record<string, number>) => Promise<void>;
  onReset?: () => Promise<void>;
  onClose: () => void;
}) {
  const [vals, setVals] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, String(f.value)])),
  );
  const [busy, setBusy] = useState(false);
  const bad = Object.values(vals).some((v) => v.trim() === '' || Number.isNaN(toNum(v)) || toNum(v) < 0);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      onClose();
    } finally {
      setBusy(false);
    }
  };
  const save = () => run(() => onSave(Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, toNum(v)]))));
  return (
    <div className="flex flex-col items-end gap-1">
      {fields.map((f, i) => (
        <label key={f.key} className="flex items-center gap-1 text-[11px] text-gray-500">
          {f.label}
          <input
            autoFocus={i === 0}
            value={vals[f.key]}
            onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !bad) save();
              if (e.key === 'Escape') onClose();
            }}
            className="w-20 px-1.5 py-0.5 border border-gray-300 rounded text-right text-sm text-gray-900"
          />
        </label>
      ))}
      <div className="flex items-center gap-1.5">
        <button disabled={busy || bad} onClick={save} className="text-emerald-600 hover:text-emerald-800 disabled:opacity-40" title="Сохранить">
          <Icon name={busy ? 'Loader2' : 'Check'} size={16} className={busy ? 'animate-spin' : ''} />
        </button>
        {onReset && (
          <button disabled={busy} onClick={() => run(onReset)} className="text-gray-400 hover:text-red-600" title="Вернуть по умолчанию">
            <Icon name="RotateCcw" size={14} />
          </button>
        )}
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700" title="Отмена">
          <Icon name="X" size={14} />
        </button>
      </div>
    </div>
  );
}

function StaffDirectory({ data, onStaffRate }: { data: FixedData; onStaffRate: Props['onStaffRate'] }) {
  const [edit, setEdit] = useState<string | null>(null);
  const seen = new Set<string>();
  const list = data.staff.filter((s) => {
    if (s.role !== 'admin') return true;
    if (seen.has('admin')) return false;
    seen.add('admin');
    return true;
  });
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Ставки сотрудников</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Все ставки — до вычета НДФЛ. Страховые {String(data.insurance_pct).replace('.', ',')}% и отпускные{' '}
          {String(data.vacation_pct).replace('.', ',')}% — только для найма. Новая ставка применяется ко всем месяцам без разовой ставки.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Сотрудник</th>
              <th className="text-left px-4 py-2 font-medium">Тип</th>
              <th className="text-right px-4 py-2 font-medium">Ставка</th>
              <th className="text-left px-4 py-2 font-medium">Дополнительно</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => {
              const isAdmin = s.role === 'admin';
              const name = isAdmin ? 'Админы (1 на смене)' : s.role === 'designer' ? 'Дизайнеры' : s.name;
              const extra = [
                s.bonus_pct ? `бонус ${String(s.bonus_pct).replace('.', ',')}% от аванса` : '',
                s.substitution_rate ? `замены ${Math.round(s.substitution_rate)} ₽/урок` : '',
                isAdmin ? `${data.admin_shifts_default} смен/мес · KPI до ${Math.round(s.rate_max || 0)} ₽/смена` : '',
                s.role === 'designer' ? 'сумма вводится вручную по месяцам' : '',
                s.insurance_applies ? 'страховые + отпускные' : '',
              ].filter(Boolean).join(' · ');
              return (
                <tr key={s.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-900">{name}</td>
                  <td className="px-4 py-2 text-gray-500">{TYPE_LABEL[s.type] || s.type}</td>
                  <td className="px-4 py-2 text-right">
                    {edit === s.id ? (
                      <Editor
                        fields={[{ key: 'rate', label: RATE_UNIT[s.rate_unit || ''] || '', value: s.rate || 0 }]}
                        onSave={(v) => onStaffRate(s.id, v.rate)}
                        onClose={() => setEdit(null)}
                      />
                    ) : (
                      <button onClick={() => setEdit(s.id)} className="group inline-flex items-center gap-1.5 text-gray-900 hover:text-emerald-700">
                        {Math.round(s.rate || 0).toLocaleString('ru-RU')} {RATE_UNIT[s.rate_unit || ''] || ''}
                        <Icon name="Pencil" size={12} className="text-gray-300 group-hover:text-emerald-600" />
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">{extra}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const FixedExpensesTable = ({ data, active, onExpense, onInputs, onStaffMonth, onStaffRate }: Props) => {
  const [edit, setEdit] = useState<string | null>(null);
  const months = data.months;

  const editorFor = (row: FixedRow, m: string) => {
    const close = () => setEdit(null);
    const v = row.values[m]?.[active] ?? 0;
    const src = row.sources[m];
    if (STAFF_BY_ROW[row.key]) {
      const sid = STAFF_BY_ROW[row.key];
      return (
        <Editor
          fields={[{ key: 'v', label: 'разово', value: v }]}
          onSave={(x) => onStaffMonth(sid, m, x.v)}
          onReset={src === 'override' ? () => onStaffMonth(sid, m, null) : undefined}
          onClose={close}
        />
      );
    }
    if (row.key === 'admins') {
      const inp = row.inputs?.[m] || { rate: 700, shifts: data.admin_shifts_default };
      return (
        <Editor
          fields={[{ key: 'rate', label: '₽/смена', value: inp.rate }, { key: 'shifts', label: 'смен', value: inp.shifts }]}
          onSave={(x) => onInputs(m, { admin_rate_override: x.rate, admin_shifts_override: Math.round(x.shifts) })}
          onReset={src === 'manual' ? () => onInputs(m, { admin_rate_override: null, admin_shifts_override: null }) : undefined}
          onClose={close}
        />
      );
    }
    if (row.key === 'ruo_replacements') {
      const n = Number((row.notes[m] || '0').replace(/\D/g, '')) || 0;
      return (
        <Editor
          fields={[{ key: 'n', label: 'уроков', value: n }]}
          onSave={(x) => onInputs(m, { ruo_replacements: Math.round(x.n) })}
          onReset={src === 'manual' ? () => onInputs(m, { ruo_replacements: null }) : undefined}
          onClose={close}
        />
      );
    }
    return (
      <Editor
        fields={[{ key: 'v', label: '₽', value: v }]}
        onSave={(x) => onExpense(m, row.key, x.v)}
        onReset={src === 'manual' ? () => onExpense(m, row.key, null) : undefined}
        onClose={close}
      />
    );
  };

  const isEditable = (row: FixedRow) => row.editable || !!STAFF_BY_ROW[row.key];
  const staffRows = data.rows.filter((r) => r.group === 'staff');
  const itemRows = data.rows.filter((r) => r.group === 'items');

  const renderRow = (row: FixedRow) => {
    const rs = ROW_SOURCE[row.source];
    const scenarioDependent = row.key === 'ruo_bonus';
    return (
      <tr key={row.key} className="border-t border-gray-100 hover:bg-gray-50/60">
        <td className="sticky left-0 bg-white px-4 py-2 min-w-[230px] z-10">
          <div className="text-gray-900">{row.name}</div>
          {(row.note || scenarioDependent) && (
            <div className="text-[11px] text-gray-400">
              {scenarioDependent ? `зависит от сценария · ${SCENARIO_LABEL[active]}` : row.note}
            </div>
          )}
        </td>
        {months.map((m) => {
          const key = `${row.key}|${m}`;
          const val = row.values[m]?.[active];
          const hint = CELL_HINT[row.sources[m]];
          const note = row.notes[m];
          const editable = isEditable(row);
          return (
            <td key={m} className="px-3 py-2 text-right whitespace-nowrap align-top">
              {edit === key ? (
                editorFor(row, m)
              ) : (
                <button
                  disabled={!editable}
                  onClick={() => setEdit(key)}
                  className={`group inline-flex flex-col items-end ${editable ? 'cursor-pointer hover:text-emerald-700' : 'cursor-default'}`}
                  title={note || undefined}
                >
                  <span className="inline-flex items-center gap-1 tabular-nums text-gray-900">
                    {val ? Math.round(val).toLocaleString('ru-RU') : <span className="text-gray-300">0</span>}
                    {editable && <Icon name="Pencil" size={10} className="text-gray-200 group-hover:text-emerald-600" />}
                  </span>
                  {(hint || (note && row.key === 'admins')) && (
                    <span className={`text-[10px] ${hint?.cls || 'text-gray-400'}`}>
                      {row.key === 'admins' ? note : hint?.label}
                    </span>
                  )}
                </button>
              )}
            </td>
          );
        })}
        <td className="px-4 py-2 whitespace-nowrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${rs.cls}`}>{rs.label}</span>
        </td>
      </tr>
    );
  };

  const sumRow = (label: string, get: (m: string) => number, cls: string) => (
    <tr className={cls}>
      <td className="sticky left-0 px-4 py-2 z-10 bg-inherit">{label}</td>
      {months.map((m) => (
        <td key={m} className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
          {Math.round(get(m)).toLocaleString('ru-RU')}
        </td>
      ))}
      <td className="px-4 py-2 text-xs">—</td>
    </tr>
  );

  const groupHead = (label: string) => (
    <tr className="bg-gray-50">
      <td colSpan={months.length + 2} className="sticky left-0 px-4 py-1.5 text-[11px] uppercase tracking-wide text-gray-500 font-medium">
        {label}
      </td>
    </tr>
  );

  const cur = data.totals[months[0]]?.total[active];
  const annual = months.reduce((s, m) => s + (data.totals[m]?.total_with_ano[active] || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500">Постоянные, {fmMonthLabel(months[0])}</div>
          <div className="text-2xl font-bold text-rose-700">{fmMoney(cur)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500">За {months.length} мес с АНО · {SCENARIO_LABEL[active]}</div>
          <div className="text-2xl font-bold text-gray-900">{fmMoney(annual)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-xs text-gray-500 leading-relaxed">
          Суммы фиксированные и одинаковы во всех сценариях — меняется только бонус РУО (0,5% от аванса сценария).
          Нажмите на сумму, чтобы изменить её для месяца.
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Постоянные расходы по месяцам</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Ручной ввод: реклама, нейронка нерегуляр, дизайнеры, замены РУО, смены/ставка админов (KPI). Для сотрудников на окладе можно задать разовую ставку месяца.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="sticky left-0 bg-gray-50 text-left px-4 py-2 font-medium z-10">Статья</th>
                {months.map((m) => (
                  <th key={m} className={`text-right px-3 py-2 font-medium whitespace-nowrap ${m === data.current_month ? 'text-emerald-700' : ''}`}>
                    {fmMonthLabel(m)}
                  </th>
                ))}
                <th className="text-left px-4 py-2 font-medium">Источник</th>
              </tr>
            </thead>
            <tbody>
              {groupHead('Сотрудники')}
              {staffRows.map(renderRow)}
              {groupHead('Сервисы, реклама, подрядчики')}
              {itemRows.map(renderRow)}
              {sumRow('Итого без дизайнеров', (m) => data.totals[m]?.total_wo_designers[active] || 0, 'bg-gray-50 text-gray-600 border-t border-gray-200')}
              {sumRow('Итого постоянных', (m) => data.totals[m]?.total[active] || 0, 'bg-gray-100 font-semibold text-gray-900 border-t border-gray-200')}
              {sumRow('АНО (отдельная строка)', (m) => data.totals[m]?.ano || 0, 'bg-white text-gray-700 border-t border-gray-100')}
              {sumRow('Итого с АНО', (m) => data.totals[m]?.total_with_ano[active] || 0, 'bg-rose-50 font-semibold text-rose-900 border-t border-rose-100')}
            </tbody>
          </table>
        </div>
      </div>

      <StaffDirectory data={data} onStaffRate={onStaffRate} />
    </div>
  );
};

export default FixedExpensesTable;
