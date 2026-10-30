import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Lead, LeadSlot, SPECIAL_PRESETS, SPECIAL_STATUS, WAIT_SLOTS } from '@/lib/leadsApi';
import WishedSlots from './WishedSlots';

const OTHER = '__other__';

// Причина «особых условий»: ждут маткапитал, ждут окошки или своя — вводится вручную.
export default function SpecialCondition({ lead, onChange, onSlots, compact = false }: {
  lead: Lead;
  onChange?: (value: string) => void;
  onSlots?: (slots: LeadSlot[]) => void;
  compact?: boolean;
}) {
  const value = lead.special_condition || '';
  const isCustom = value !== '' && !SPECIAL_PRESETS.includes(value);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(isCustom ? value : '');

  useEffect(() => {
    if (!editing) setText(isCustom ? value : '');
  }, [value, isCustom, editing]);

  if ((lead.lead_status || '').trim() !== SPECIAL_STATUS) return null;

  const size = compact ? 'text-[10px]' : 'text-xs';
  const commit = () => {
    setEditing(false);
    const t = text.trim();
    if (t && t !== value) onChange?.(t);
  };

  if (editing && onChange) {
    return (
      <div className="mt-1" onMouseDown={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
          placeholder="Укажите причину"
          className={`w-full max-w-[200px] rounded-md border border-violet-300 px-2 py-0.5 ${size} outline-none focus:ring-1 focus:ring-violet-400`}
        />
      </div>
    );
  }

  return (
    <div className="mt-1">
      <div className="relative inline-flex max-w-full" title="Причина особых условий">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium max-w-full ${size} ${
            value
              ? 'bg-violet-50 text-violet-800 border border-violet-200'
              : 'bg-gray-50 text-violet-500 border border-dashed border-violet-300'
          }`}
        >
          <Icon name="Hourglass" size={compact ? 10 : 12} className="shrink-0" />
          <span className="truncate">{value || 'выбрать причину'}</span>
          {onChange && <Icon name="ChevronDown" size={compact ? 10 : 12} className="opacity-60 shrink-0" />}
        </span>
        {onChange && (
          <select
            value={isCustom ? OTHER : value}
            onChange={(e) => {
              const v = e.target.value;
              if (v === OTHER) {
                setText(isCustom ? value : '');
                setEditing(true);
              } else if (v) {
                onChange(v);
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          >
            {!value && <option value="">—</option>}
            {SPECIAL_PRESETS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
            <option value={OTHER}>{isCustom ? `другое: ${value}` : 'другое (указать)'}</option>
          </select>
        )}
      </div>
      {value === WAIT_SLOTS && (
        <WishedSlots slots={lead.special_slots || []} onChange={onChange ? onSlots : undefined} compact={compact} />
      )}
    </div>
  );
}
