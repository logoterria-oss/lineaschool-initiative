import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Lead, NO_CONTACT_STATUS, WINDOW_STAGE, noContactStages } from '@/lib/leadsApi';

const CALL_STAGES = ['звонок 1', 'звонок 2'];

function fmt(v?: string | null): string {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// Этап дозвона для статуса «Связь через "Окно" не налажена».
// У каждого пройденного этапа — дата и время: вручную, кроме сообщения в «Окно» (берётся из переписки).
// Последний этап («лид не вышел на связь») отправляет карточку в архив.
export default function NoContactStage({ lead, onStage, onStageDate, compact = false }: {
  lead: Lead;
  onStage: (stage: string) => void;
  onStageDate?: (stage: string, value: string) => void;
  compact?: boolean;
}) {
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const [askTime, setAskTime] = useState('');

  // Выбрали звонок — сразу открываем выбор даты и времени этого звонка
  useEffect(() => {
    if (!askTime) return;
    const t = setTimeout(() => {
      const el = inputs.current[askTime];
      if (el) {
        try { el.showPicker(); } catch { el.focus(); }
      }
      setAskTime('');
    }, 50);
    return () => clearTimeout(t);
  }, [askTime, lead.no_contact_stage]);

  if ((lead.lead_status || '') !== NO_CONTACT_STATUS) return null;
  const stages = noContactStages(lead.processing_status);
  const value = lead.no_contact_stage || '';
  const idx = stages.indexOf(value);
  const last = stages.length - 1;
  const dates = lead.no_contact_stage_dates || {};
  const text = compact ? 'text-[10px]' : 'text-[11px]';

  return (
    <div className="mt-1">
      <div className="relative inline-flex" title="Этап связи с лидом">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
            compact ? 'text-[10px]' : 'text-xs'
          } ${
            idx === last
              ? 'bg-red-100 text-red-700'
              : value
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-gray-50 text-gray-400 border border-dashed border-gray-300'
          }`}
        >
          <Icon name="PhoneForwarded" size={compact ? 10 : 12} className="shrink-0" />
          {value ? `${idx + 1}/${stages.length} · ${value}` : 'выбрать этап'}
          <Icon name="ChevronDown" size={compact ? 10 : 12} className="opacity-60" />
        </span>
        <select
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            onStage(v);
            if (onStageDate && CALL_STAGES.includes(v)) setAskTime(v);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        >
          <option value="">—</option>
          {stages.map((s, i) => (
            <option key={s} value={s}>
              {i + 1}. {s}{i === last ? ' (в архив)' : ''}
            </option>
          ))}
        </select>
      </div>

      {idx >= 0 && (
        <div className={`mt-1 space-y-0.5 ${text}`}>
          {stages.slice(0, idx + 1).map((s) => {
            const auto = s === WINDOW_STAGE;
            const shown = auto ? fmt(lead.window_first_at) : fmt(dates[s]);
            return (
              <div key={s} className="flex items-center gap-1 text-gray-500 whitespace-nowrap">
                <Icon name={auto ? 'MessageSquare' : 'Clock'} size={10} className="shrink-0 text-gray-400" />
                <span className="truncate max-w-[110px]" title={s}>{s}:</span>
                {auto ? (
                  <span className="font-medium text-gray-700" title="Первое сообщение в «Окне» — подставляется автоматически">
                    {shown || 'нет в «Окне»'}
                  </span>
                ) : (
                  <label className="relative cursor-pointer font-medium text-gray-700 hover:text-amber-700" title="Изменить дату и время">
                    {shown || <span className="text-amber-600">указать</span>}
                    <input
                      ref={(el) => { inputs.current[s] = el; }}
                      type="datetime-local"
                      value={dates[s] || ''}
                      disabled={!onStageDate}
                      onChange={(e) => onStageDate?.(s, e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
