import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { FixedActualLine, FixedActualOp, FixedActuals, fmMonthLabel } from '@/lib/finmodelApi';

interface Props {
  data: FixedActuals;
  onAction: (v: FixedActualOp) => Promise<void>;
}

const toNum = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.'));

function AmountCell({ line, month, onAction }: { line: FixedActualLine; month: string; onAction: Props['onAction'] }) {
  const v = line.values[month];
  const [edit, setEdit] = useState(false);
  const [val, setVal] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async (amount: number | null) => {
    setBusy(true);
    try {
      await onAction({ op: 'set', line_id: line.id, month, amount });
      setEdit(false);
    } finally {
      setBusy(false);
    }
  };
  if (edit) {
    const bad = val.trim() !== '' && (Number.isNaN(toNum(val)) || toNum(val) < 0);
    return (
      <div className="flex items-center justify-end gap-1">
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !bad) save(val.trim() === '' ? null : toNum(val));
            if (e.key === 'Escape') setEdit(false);
          }}
          className="w-24 px-1.5 py-0.5 border border-gray-300 rounded text-right text-sm"
        />
        <button
          disabled={busy || bad}
          onClick={() => save(val.trim() === '' ? null : toNum(val))}
          className="text-emerald-600 hover:text-emerald-800 disabled:opacity-40"
          title="Сохранить (пусто — очистить)"
        >
          <Icon name={busy ? 'Loader2' : 'Check'} size={15} className={busy ? 'animate-spin' : ''} />
        </button>
        <button onClick={() => setEdit(false)} className="text-gray-400 hover:text-gray-700" title="Отмена">
          <Icon name="X" size={13} />
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={() => {
        setVal(v != null ? String(Math.round(v)) : '');
        setEdit(true);
      }}
      className="group inline-flex items-center gap-1 tabular-nums text-gray-900 hover:text-emerald-700"
    >
      {v ? Math.round(v).toLocaleString('ru-RU') : <span className="text-gray-300">—</span>}
      <Icon name="Pencil" size={10} className="text-gray-200 group-hover:text-emerald-600" />
    </button>
  );
}

function LineName({ line, onAction }: { line: FixedActualLine; onAction: Props['onAction'] }) {
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(line.name);
  if (edit) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === 'Enter' && name.trim()) {
              await onAction({ op: 'rename', line_id: line.id, name: name.trim() });
              setEdit(false);
            }
            if (e.key === 'Escape') setEdit(false);
          }}
          className="w-full px-1.5 py-0.5 border border-gray-300 rounded text-sm"
        />
      </div>
    );
  }
  return (
    <div className="group flex items-center gap-1.5">
      <span className="text-gray-900">{line.name}</span>
      <button onClick={() => setEdit(true)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-700" title="Переименовать">
        <Icon name="Pencil" size={11} />
      </button>
      <button
        onClick={() => {
          if (window.confirm(`Убрать строку «${line.name}» со всеми суммами за прошлые месяцы?`)) {
            onAction({ op: 'delete_line', line_id: line.id });
          }
        }}
        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-600"
        title="Убрать строку"
      >
        <Icon name="Trash2" size={12} />
      </button>
    </div>
  );
}

function AddLine({ group, onAction, cols }: { group: 'staff' | 'items'; onAction: Props['onAction']; cols: number }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const add = async () => {
    if (!name.trim()) return;
    await onAction({ op: 'add_line', name: name.trim(), group });
    setName('');
    setOpen(false);
  };
  return (
    <tr className="border-t border-gray-100">
      <td colSpan={cols} className="sticky left-0 bg-white px-4 py-1.5">
        {open ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={name}
              placeholder={group === 'staff' ? 'Имя или должность' : 'Название расхода'}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') add();
                if (e.key === 'Escape') setOpen(false);
              }}
              className="w-64 px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <button onClick={add} className="text-sm text-emerald-700 hover:text-emerald-900">Добавить</button>
            <button onClick={() => setOpen(false)} className="text-sm text-gray-400 hover:text-gray-700">Отмена</button>
          </div>
        ) : (
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900">
            <Icon name="Plus" size={13} />
            {group === 'staff' ? 'Добавить сотрудника' : 'Добавить расход'}
          </button>
        )}
      </td>
    </tr>
  );
}

/** Факт постоянных расходов за все прошедшие месяцы: любые суммы и строки меняются вручную. */
const FixedActualsTable = ({ data, onAction }: Props) => {
  const months = data.months;
  const cols = months.length + 2;
  const staff = data.lines.filter((l) => l.group === 'staff');
  const items = data.lines.filter((l) => l.group === 'items');
  const rowTotal = (l: FixedActualLine) => months.reduce((s, m) => s + (l.values[m] || 0), 0);
  const grand = months.reduce((s, m) => s + (data.totals[m] || 0), 0);

  const renderLine = (l: FixedActualLine) => (
    <tr key={l.id} className="border-t border-gray-100 hover:bg-gray-50/60">
      <td className="sticky left-0 bg-white px-4 py-2 min-w-[240px] z-10">
        <LineName line={l} onAction={onAction} />
      </td>
      {months.map((m) => (
        <td key={m} className="px-3 py-2 text-right whitespace-nowrap">
          <AmountCell line={l} month={m} onAction={onAction} />
        </td>
      ))}
      <td className="px-4 py-2 text-right tabular-nums text-gray-600 whitespace-nowrap">
        {Math.round(rowTotal(l)).toLocaleString('ru-RU')}
      </td>
    </tr>
  );

  const head = (label: string) => (
    <tr className="bg-gray-50">
      <td colSpan={cols} className="sticky left-0 px-4 py-1.5 text-[11px] uppercase tracking-wide text-gray-500 font-medium">
        {label}
      </td>
    </tr>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Факт: прошедшие месяцы</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Сколько реально потрачено. Нажмите на сумму, чтобы изменить (пустое значение — очистить). Строки можно
          добавлять, переименовывать и убирать. Завершённый месяц один раз заполняется по модели, дальше — только вручную.
          Итоги идут в P&L и Cash Flow за прошедшие месяцы модели (с сентября 2026), прогноз будущих месяцев не меняют.
        </p>
      </div>
      {months.length === 0 ? (
        <div className="p-6 text-sm text-gray-500">Прошедших месяцев пока нет.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="sticky left-0 bg-gray-50 text-left px-4 py-2 font-medium z-10">Статья</th>
                {months.map((m) => (
                  <th key={m} className="text-right px-3 py-2 font-medium whitespace-nowrap">{fmMonthLabel(m)}</th>
                ))}
                <th className="text-right px-4 py-2 font-medium">Всего</th>
              </tr>
            </thead>
            <tbody>
              {head('Сотрудники')}
              {staff.map(renderLine)}
              <AddLine group="staff" onAction={onAction} cols={cols} />
              {head('Сервисы, реклама, подрядчики')}
              {items.map(renderLine)}
              <AddLine group="items" onAction={onAction} cols={cols} />
              <tr className="bg-rose-50 font-semibold text-rose-900 border-t border-rose-100">
                <td className="sticky left-0 px-4 py-2 z-10 bg-rose-50">Итого постоянных (факт)</td>
                {months.map((m) => (
                  <td key={m} className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                    {Math.round(data.totals[m] || 0).toLocaleString('ru-RU')}
                  </td>
                ))}
                <td className="px-4 py-2 text-right tabular-nums whitespace-nowrap">{Math.round(grand).toLocaleString('ru-RU')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FixedActualsTable;