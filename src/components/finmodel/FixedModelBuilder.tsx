import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { FixedData, FixedModelOp, fmMonthLabel } from '@/lib/finmodelApi';

interface Props {
  data: FixedData;
  onAction: (v: FixedModelOp) => Promise<void>;
}

const TYPES: [string, string][] = [
  ['hired', 'найм (+ страховые и отпускные)'],
  ['contractor', 'подрядчик'],
  ['self_employed', 'самозанятый'],
  ['informal', 'в чёрную'],
];
const TYPE_SHORT: Record<string, string> = {
  hired: 'найм', contractor: 'подрядчик', self_employed: 'самозанятый', informal: 'в чёрную',
};
const ROLE_NAME: Record<string, string> = { admin: 'Админы (1 на смене)', designer: 'Дизайнеры' };

const toNum = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.'));

const periodLabel = (f: string | null, t: string | null) => {
  if (!f && !t) return 'весь период';
  if (f && t) return `${fmMonthLabel(f)} — ${fmMonthLabel(t)}`;
  return f ? `с ${fmMonthLabel(f)}` : `по ${fmMonthLabel(t!)}`;
};

interface Draft {
  id?: string;
  kind: 'staff' | 'item';
  custom: boolean;
  name: string;
  type: string;
  amount: string;
  from: string;
  to: string;
}

function MonthSelect({ value, onChange, months, empty }: {
  value: string; onChange: (v: string) => void; months: string[]; empty: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white">
      <option value="">{empty}</option>
      {months.map((m) => <option key={m} value={m}>{fmMonthLabel(m)}</option>)}
    </select>
  );
}

function DraftForm({ draft, months, onCancel, onSave }: {
  draft: Draft; months: string[]; onCancel: () => void; onSave: (d: Draft) => Promise<void>;
}) {
  const [d, setD] = useState(draft);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const badAmount = d.custom && (d.amount.trim() === '' || Number.isNaN(toNum(d.amount)) || toNum(d.amount) < 0);
  const badPeriod = !!d.from && !!d.to && d.from > d.to;
  const save = async () => {
    setBusy(true);
    setErr('');
    try {
      await onSave(d);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        {d.custom && (
          <label className="text-[11px] text-gray-500 flex flex-col gap-0.5">
            {d.kind === 'staff' ? 'Сотрудник / должность' : 'Расход'}
            <input
              autoFocus
              value={d.name}
              onChange={(e) => setD({ ...d, name: e.target.value })}
              className="w-56 border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900"
            />
          </label>
        )}
        {d.custom && d.kind === 'staff' && (
          <label className="text-[11px] text-gray-500 flex flex-col gap-0.5">
            Оформление
            <select value={d.type} onChange={(e) => setD({ ...d, type: e.target.value })} className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white text-gray-900">
              {TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
        )}
        {d.custom && (
          <label className="text-[11px] text-gray-500 flex flex-col gap-0.5">
            {d.kind === 'staff' ? 'Оклад, ₽/мес' : 'Сумма, ₽/мес'}
            <input
              value={d.amount}
              onChange={(e) => setD({ ...d, amount: e.target.value })}
              className="w-28 border border-gray-300 rounded px-2 py-1.5 text-sm text-right text-gray-900"
            />
          </label>
        )}
        <label className="text-[11px] text-gray-500 flex flex-col gap-0.5">
          С месяца
          <MonthSelect value={d.from} onChange={(v) => setD({ ...d, from: v })} months={months} empty="с начала" />
        </label>
        <label className="text-[11px] text-gray-500 flex flex-col gap-0.5">
          По месяц
          <MonthSelect value={d.to} onChange={(v) => setD({ ...d, to: v })} months={months} empty="без окончания" />
        </label>
        <button
          disabled={busy || badAmount || badPeriod || (d.custom && !d.name.trim())}
          onClick={save}
          className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-40 inline-flex items-center gap-1"
        >
          {busy && <Icon name="Loader2" size={14} className="animate-spin" />}
          Сохранить
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100">Отмена</button>
      </div>
      {badPeriod && <div className="text-xs text-red-600">«С» должно быть не позже «по»</div>}
      {err && <div className="text-xs text-red-600">{err}</div>}
    </div>
  );
}

/**
 * Конструктор прогноза постоянных расходов: сотрудники и статьи с периодом действия.
 * Любое изменение сразу пересчитывает постоянные расходы и всю модель.
 */
const FixedModelBuilder = ({ data, onAction }: Props) => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const months = data.months;

  const seen = new Set<string>();
  const staff = data.staff.filter((s) => {
    if (s.role !== 'admin') return true;
    if (seen.has('admin')) return false;
    seen.add('admin');
    return true;
  });

  const submit = async (d: Draft) => {
    const period = { active_from: d.from || null, active_to: d.to || null };
    if (d.kind === 'staff') {
      await onAction(d.id
        ? { op: 'staff_update', id: d.id, name: d.name, type: d.type, rate: d.custom ? toNum(d.amount) : undefined, ...period }
        : { op: 'staff_add', name: d.name, type: d.type, rate: toNum(d.amount), ...period });
    } else {
      await onAction(d.id
        ? { op: 'item_update', id: d.id, name: d.name, amount: d.custom ? toNum(d.amount) : undefined, ...period }
        : { op: 'item_add', name: d.name, amount: toNum(d.amount), ...period });
    }
    setDraft(null);
  };

  const remove = async (kind: 'staff' | 'item', id: string, name: string) => {
    if (!window.confirm(`Убрать «${name}» из модели?`)) return;
    await onAction({ op: kind === 'staff' ? 'staff_delete' : 'item_delete', id });
  };

  const rowActions = (kind: 'staff' | 'item', id: string, name: string, custom: boolean, start: () => void) => (
    <div className="flex items-center justify-end gap-2">
      <button onClick={start} className="text-gray-400 hover:text-emerald-700" title={custom ? 'Изменить' : 'Задать период'}>
        <Icon name={custom ? 'Pencil' : 'CalendarRange'} size={14} />
      </button>
      {custom && (
        <button onClick={() => remove(kind, id, name)} className="text-gray-400 hover:text-red-600" title="Убрать">
          <Icon name="Trash2" size={14} />
        </button>
      )}
    </div>
  );

  const newDraft = (kind: 'staff' | 'item'): Draft => ({
    kind, custom: true, name: '', type: 'contractor', amount: '', from: data.current_month, to: '',
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">Конструктор прогноза</h3>
          <p className="text-xs text-gray-500 mt-0.5 max-w-3xl">
            Добавляйте и убирайте сотрудников и расходы, задавайте период «с — по». Вне периода сумма = 0.
            Модель пересчитывается сразу: таблица прогноза ниже, P&L, Cash Flow, налоги и дашборд.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setDraft(newDraft('staff'))} className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50 inline-flex items-center gap-1">
            <Icon name="UserPlus" size={14} /> Сотрудник
          </button>
          <button onClick={() => setDraft(newDraft('item'))} className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50 inline-flex items-center gap-1">
            <Icon name="Plus" size={14} /> Расход
          </button>
        </div>
      </div>

      {draft && !draft.id && (
        <div className="px-5 pt-4">
          <DraftForm draft={draft} months={months} onCancel={() => setDraft(null)} onSave={submit} />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-x-6 p-5 pt-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-gray-500 font-medium py-2">Сотрудники</div>
          <div className="divide-y divide-gray-100">
            {staff.map((s) => {
              const name = ROLE_NAME[s.role] || s.name;
              const editing = draft?.id === s.id;
              return (
                <div key={s.id} className="py-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 truncate">
                        {name}
                        {s.is_custom && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">новый</span>}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {TYPE_SHORT[s.type] || s.type}
                        {s.rate_unit === 'rub_month' && s.rate ? ` · ${Math.round(s.rate).toLocaleString('ru-RU')} ₽/мес` : ''}
                        {' · '}
                        <span className={s.active_from || s.active_to ? 'text-amber-700' : ''}>{periodLabel(s.active_from, s.active_to)}</span>
                      </div>
                    </div>
                    {rowActions('staff', s.id, name, s.is_custom, () => setDraft({
                      id: s.id, kind: 'staff', custom: s.is_custom, name: s.name, type: s.type,
                      amount: String(Math.round(s.rate || 0)), from: s.active_from || '', to: s.active_to || '',
                    }))}
                  </div>
                  {editing && draft && (
                    <div className="mt-2">
                      <DraftForm draft={draft} months={months} onCancel={() => setDraft(null)} onSave={submit} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-wide text-gray-500 font-medium py-2">Расходы</div>
          <div className="divide-y divide-gray-100">
            {data.items.map((it) => {
              const editing = draft?.id === it.id;
              const amount = it.amount_unit === 'rub_year' ? (it.amount || 0) / 12 : it.amount || 0;
              return (
                <div key={it.id} className="py-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 truncate">
                        {it.name}
                        {it.is_custom && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">новый</span>}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {Math.round(amount).toLocaleString('ru-RU')} ₽/мес{!it.is_fixed ? ' по умолч.' : ''}
                        {' · '}
                        <span className={it.active_from || it.active_to ? 'text-amber-700' : ''}>{periodLabel(it.active_from, it.active_to)}</span>
                      </div>
                    </div>
                    {rowActions('item', it.id, it.name, it.is_custom, () => setDraft({
                      id: it.id, kind: 'item', custom: it.is_custom, name: it.name, type: '',
                      amount: String(Math.round(amount)), from: it.active_from || '', to: it.active_to || '',
                    }))}
                  </div>
                  {editing && draft && (
                    <div className="mt-2">
                      <DraftForm draft={draft} months={months} onCancel={() => setDraft(null)} onSave={submit} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixedModelBuilder;
