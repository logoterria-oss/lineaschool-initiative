import Icon from '@/components/ui/icon';
import { Lead, STUCK_REMINDED, STUCK_STAGES, hasStuckFlow } from '@/lib/leadsApi';

const DAY = 86400_000;

const parse = (v?: string | null): Date | null => {
  if (!v) return null;
  const d = new Date(v.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
};

const fmt = (d: Date | null) =>
  d ? d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

/** Когда можно ставить «уточнили актуальность» — через день после «напомнили о себе» */
export function stuckNextAt(lead: Lead): Date | null {
  const t = parse(lead.stuck_stage_dates?.[STUCK_REMINDED]);
  return t ? new Date(t.getTime() + DAY) : null;
}

// Этапы дожима зависшего лида: «напомнили о себе» → через день «уточнили актуальность диагностики».
// Через день после второго этапа без движения лид уходит в архив со статусом «игнор».
export default function StuckStage({ lead, onStage, compact = false }: {
  lead: Lead;
  onStage?: (stage: string) => void;
  compact?: boolean;
}) {
  if (!hasStuckFlow(lead)) return null;
  const value = lead.stuck_stage || '';
  const idx = STUCK_STAGES.indexOf(value);
  const dates = lead.stuck_stage_dates || {};
  const nextAt = stuckNextAt(lead);
  const secondLocked = !nextAt || nextAt.getTime() > Date.now();
  const text = compact ? 'text-[10px]' : 'text-[11px]';

  return (
    <div className="mt-1">
      <div className="relative inline-flex" title="Этап работы с зависшим лидом">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${compact ? 'text-[10px]' : 'text-xs'} ${
            value
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-gray-50 text-gray-400 border border-dashed border-gray-300'
          }`}
        >
          <Icon name="BellRing" size={compact ? 10 : 12} className="shrink-0" />
          {value ? `${idx + 1}/${STUCK_STAGES.length} · ${value}` : 'выбрать этап'}
          {onStage && <Icon name="ChevronDown" size={compact ? 10 : 12} className="opacity-60" />}
        </span>
        {onStage && (
          <select
            value={value}
            onChange={(e) => onStage(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          >
            <option value="">—</option>
            {STUCK_STAGES.map((s, i) => (
              <option key={s} value={s} disabled={i === 1 && secondLocked && value !== s}>
                {i + 1}. {s}
                {i === 1 && secondLocked && value !== s ? (nextAt ? ` (с ${fmt(nextAt)})` : ' (после этапа 1)') : ''}
              </option>
            ))}
          </select>
        )}
      </div>
      {idx >= 0 && (
        <div className={`mt-1 space-y-0.5 ${text} text-gray-500`}>
          {STUCK_STAGES.slice(0, idx + 1).map((s) => (
            <div key={s} className="flex items-center gap-1 whitespace-nowrap">
              <Icon name="Clock" size={10} className="shrink-0 text-gray-400" />
              <span className="truncate max-w-[150px]" title={s}>{s}:</span>
              <span className="font-medium text-gray-700">{fmt(parse(dates[s])) || '—'}</span>
            </div>
          ))}
          {idx === 0 && nextAt && (
            <div className="text-gray-400">этап 2 — с {fmt(nextAt)}</div>
          )}
          {idx === 1 && parse(dates[s2()]) && (
            <div className="text-gray-400">
              без движения с {fmt(new Date(parse(dates[s2()])!.getTime() + DAY))} — в архив («игнор»)
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s2 = () => STUCK_STAGES[1];
