import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { LeadSlot, WEEKDAYS } from '@/lib/leadsApi';

const fmtSlot = (s: LeadSlot) => {
  const days = WEEKDAYS.filter((d) => s.days.includes(d)).join(', ');
  const time = s.from && s.to ? `${s.from}–${s.to}` : s.from ? `с ${s.from}` : s.to ? `до ${s.to}` : 'любое время';
  return `${days} · ${time}`;
};

// Какие дни и время просит лид, пока ждёт окошко. Несколько вариантов, каждый — дни + интервал.
export default function WishedSlots({ slots, onChange, compact = false }: {
  slots: LeadSlot[];
  onChange?: (slots: LeadSlot[]) => void;
  compact?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [days, setDays] = useState<string[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const size = compact ? 'text-[10px]' : 'text-xs';

  const reset = () => { setAdding(false); setDays([]); setFrom(''); setTo(''); };
  const add = () => {
    if (!days.length || !onChange) return;
    onChange([...slots, { days, from, to }]);
    reset();
  };

  return (
    <div className={`mt-1 space-y-1 ${size}`} onMouseDown={(e) => e.stopPropagation()}>
      {slots.length === 0 && !adding && !onChange && <div className="text-gray-400">окошки не указаны</div>}
      {slots.map((s, i) => (
        <div key={i} className="flex items-center gap-1 rounded-md bg-violet-50 border border-violet-100 px-1.5 py-0.5 text-violet-900 max-w-[240px]">
          <Icon name="CalendarClock" size={compact ? 10 : 12} className="shrink-0 text-violet-500" />
          <span className="flex-1 truncate" title={fmtSlot(s)}>{fmtSlot(s)}</span>
          {onChange && (
            <button
              onClick={() => onChange(slots.filter((_, j) => j !== i))}
              className="shrink-0 text-violet-300 hover:text-red-500"
              title="Удалить"
            >
              <Icon name="X" size={compact ? 10 : 12} />
            </button>
          )}
        </div>
      ))}

      {onChange && (adding ? (
        <div className="rounded-md border border-violet-200 bg-white p-1.5 space-y-1.5 max-w-[240px]">
          <div className="flex flex-wrap gap-1">
            {WEEKDAYS.map((d) => {
              const on = days.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => setDays(on ? days.filter((x) => x !== d) : [...days, d])}
                  className={`w-7 rounded py-0.5 font-medium ${on ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-violet-100'}`}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <span>с</span>
            <input type="time" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-gray-200 rounded px-1 py-0.5 text-gray-800" />
            <span>до</span>
            <input type="time" value={to} onChange={(e) => setTo(e.target.value)} className="border border-gray-200 rounded px-1 py-0.5 text-gray-800" />
          </div>
          <div className="flex gap-1">
            <button
              onClick={add}
              disabled={!days.length}
              className="flex-1 rounded bg-violet-600 text-white py-0.5 font-medium disabled:opacity-40"
            >
              Добавить
            </button>
            <button onClick={reset} className="rounded bg-gray-100 text-gray-600 px-2 py-0.5">Отмена</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-violet-300 px-2 py-0.5 text-violet-600 hover:bg-violet-50"
        >
          <Icon name="Plus" size={compact ? 10 : 12} />
          {slots.length ? 'ещё окошко' : 'указать дни и время'}
        </button>
      ))}
    </div>
  );
}
