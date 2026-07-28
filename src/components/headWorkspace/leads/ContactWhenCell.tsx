import { useState } from 'react';
import Icon from '@/components/ui/icon';
import {
  MONTH_LABELS,
  ContactWhenPart,
  parseContactWhen,
  isoToDots,
} from './leadUtils';

// Человекочитаемое отображение сохранённого значения.
function humanLabel(raw: string): string {
  const p = parseContactWhen(raw);
  if (p.mode === 'date') return isoToDots(p.date);
  if (p.mode === 'range') return `${isoToDots(p.rangeFrom)} — ${isoToDots(p.rangeTo)}`;
  if (p.mode === 'part' && p.part) return `${p.part} ${MONTH_LABELS[p.month - 1]}`;
  return raw;
}

// Формирует строку хранения в предсказуемом формате, понятном парсеру.
function buildValue(state: ReturnType<typeof parseContactWhen>): string {
  if (state.mode === 'date') return isoToDots(state.date);
  if (state.mode === 'range') {
    const a = isoToDots(state.rangeFrom);
    const b = isoToDots(state.rangeTo);
    if (a && b) return `${a}-${b}`;
    return a || b;
  }
  if (state.mode === 'part' && state.part) return `${state.part} ${MONTH_LABELS[state.month - 1]}`;
  return '';
}

const PARTS: ContactWhenPart[] = ['начало', 'середина', 'конец'];

export default function ContactWhenCell({ value, onChange, onCommit }: {
  value: string;
  onChange: (v: string) => void;
  onCommit: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState(() => parseContactWhen(value));

  const open = () => {
    setState(parseContactWhen(value));
    setEditing(true);
  };

  const commit = (next: ReturnType<typeof parseContactWhen>) => {
    const v = buildValue(next);
    onChange(v);
    onCommit(v);
  };

  const update = (patch: Partial<ReturnType<typeof parseContactWhen>>) => {
    const next = { ...state, ...patch };
    setState(next);
    commit(next);
  };

  const clear = () => {
    const next = parseContactWhen('');
    setState(next);
    onChange('');
    onCommit('');
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-1">
        {value ? (
          <span className="text-xs text-gray-700 truncate max-w-[150px]">{humanLabel(value)}</span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
        <button
          onClick={open}
          className="shrink-0 text-gray-300 hover:text-amber-500"
          title="Указать срок"
        >
          <Icon name="Pencil" size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 min-w-[180px]">
      <select
        value={state.mode}
        onChange={(e) => {
          const mode = e.target.value as ReturnType<typeof parseContactWhen>['mode'];
          const next = { ...state, mode, part: mode === 'part' ? (state.part || 'начало') : state.part };
          setState(next);
          commit(next);
        }}
        className="w-full border border-gray-300 rounded px-1 py-1 text-xs outline-none focus:border-amber-400 bg-white"
      >
        <option value="">— не задано —</option>
        <option value="date">Конкретная дата</option>
        <option value="range">Диапазон дат</option>
        <option value="part">Часть месяца</option>
      </select>

      {state.mode === 'date' && (
        <input
          type="date"
          value={state.date}
          onChange={(e) => update({ date: e.target.value })}
          className="w-full border border-gray-300 rounded px-1 py-1 text-xs outline-none focus:border-amber-400"
        />
      )}

      {state.mode === 'range' && (
        <div className="space-y-1">
          <input
            type="date"
            value={state.rangeFrom}
            onChange={(e) => update({ rangeFrom: e.target.value })}
            className="w-full border border-gray-300 rounded px-1 py-1 text-xs outline-none focus:border-amber-400"
          />
          <input
            type="date"
            value={state.rangeTo}
            onChange={(e) => update({ rangeTo: e.target.value })}
            className="w-full border border-gray-300 rounded px-1 py-1 text-xs outline-none focus:border-amber-400"
          />
        </div>
      )}

      {state.mode === 'part' && (
        <div className="space-y-1">
          <select
            value={state.part || 'начало'}
            onChange={(e) => update({ part: e.target.value as ContactWhenPart })}
            className="w-full border border-gray-300 rounded px-1 py-1 text-xs outline-none focus:border-amber-400 bg-white"
          >
            {PARTS.map((p) => (
              <option key={p} value={p}>{p} месяца</option>
            ))}
          </select>
          <select
            value={state.month}
            onChange={(e) => update({ month: parseInt(e.target.value, 10) })}
            className="w-full border border-gray-300 rounded px-1 py-1 text-xs outline-none focus:border-amber-400 bg-white"
          >
            {MONTH_LABELS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <button onClick={clear} className="text-[11px] text-gray-400 hover:text-red-500">
          Очистить
        </button>
        <button onClick={() => setEditing(false)} className="text-[11px] font-semibold text-amber-600 hover:underline">
          Готово
        </button>
      </div>
    </div>
  );
}
