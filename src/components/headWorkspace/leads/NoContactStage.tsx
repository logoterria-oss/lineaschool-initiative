import Icon from '@/components/ui/icon';
import { Lead, NO_CONTACT_STATUS, noContactStages } from '@/lib/leadsApi';

// Этап дозвона для статуса «Связь через "Окно" не налажена».
// Последний этап («лид не вышел на связь») отправляет карточку в архив.
export default function NoContactStage({ lead, onStage, compact = false }: {
  lead: Lead;
  onStage: (stage: string) => void;
  compact?: boolean;
}) {
  if ((lead.lead_status || '') !== NO_CONTACT_STATUS) return null;
  const stages = noContactStages(lead.processing_status);
  const value = lead.no_contact_stage || '';
  const idx = stages.indexOf(value);
  const last = stages.length - 1;

  return (
    <div className="relative inline-flex mt-1" title="Этап связи с лидом">
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
        onChange={(e) => onStage(e.target.value)}
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
  );
}