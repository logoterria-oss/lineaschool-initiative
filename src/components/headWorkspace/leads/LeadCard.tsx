import Icon from '@/components/ui/icon';
import { Lead } from '@/lib/leadsApi';
import { Cell } from './LeadCells';
import { COLS, isUntouched, isContactDue, isContactOverdue } from './leadUtils';

// Мобильная карточка лида: все поля в столбик, редактируются теми же ячейками.
export default function LeadCard({ lead, index, onPatch, onSave, onRemove }: {
  lead: Lead;
  index: number;
  onPatch: (k: keyof Lead, v: string) => void;
  onSave: (k: keyof Lead, v: string) => void;
  onRemove: () => void;
}) {
  const untouched = isUntouched(lead);
  const overdue = isContactOverdue(lead);
  const due = isContactDue(lead);
  const borderClass = untouched
    ? 'border-red-300 bg-red-50'
    : overdue
    ? 'border-red-200'
    : due
    ? 'border-orange-200'
    : 'border-gray-200';

  return (
    <div className={`rounded-xl border ${borderClass} bg-white p-3 shadow-sm`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="text-xs text-gray-400">#{index}</div>
          <div className="font-semibold text-gray-900 truncate">
            {lead.parent_name || 'Без имени'}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {lead.student_name}
            {lead.student_age ? `, ${lead.student_age}` : ''}
          </div>
        </div>
        <button onClick={onRemove} className="shrink-0 text-gray-300 hover:text-red-500 p-1">
          <Icon name="Trash2" size={16} />
        </button>
      </div>

      <div className="space-y-2">
        {COLS.filter((c) => !['parent_name', 'student_name', 'student_age'].includes(c.key as string)).map((c) => (
          <div key={c.key} className="grid grid-cols-[110px_1fr] items-start gap-2">
            <div className="text-[11px] text-gray-400 pt-1">{c.label}</div>
            <div className="min-w-0">
              <Cell
                lead={lead}
                fieldKey={c.key}
                onChange={(v) => onPatch(c.key, v)}
                onCommit={(v) => onSave(c.key, v)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
