import { useState } from 'react';
import Icon from '@/components/ui/icon';
import {
  Lead,
  RESPONSIBLE_OPTIONS,
  PROCESSING_OPTIONS,
  leadStatusChoices,
  leadStatusClearable,
  leadStatusEditable,
} from '@/lib/leadsApi';
import NoContactStage from './NoContactStage';
import StuckStage from './StuckStage';
import SpecialCondition from './SpecialCondition';
import { processingColor, leadStatusColor } from './leadColors';
import { isContactDue, isContactOverdue } from './leadUtils';
import ContactWhenCell from './ContactWhenCell';

interface CellProps {
  lead: Lead;
  fieldKey: keyof Lead;
  onChange: (v: string) => void;
  onCommit: (v: string) => void;
  onStage?: (stage: string) => void;
  onStageDate?: (stage: string, value: string) => void;
  onSpecial?: (value: string) => void;
}

export function Cell({ lead, fieldKey, onChange, onCommit, onStage, onStageDate, onSpecial }: CellProps) {
  const value = (lead[fieldKey] as string) || '';

  if (fieldKey === 'responsible') {
    return (
      <TagSelect value={value} options={RESPONSIBLE_OPTIONS} colorClass="bg-purple-100 text-purple-800"
        onCommit={(v) => { onChange(v); onCommit(v); }} />
    );
  }
  if (fieldKey === 'processing_status') {
    return (
      <TagSelect value={value} options={PROCESSING_OPTIONS} colorClass={processingColor(value)}
        onCommit={(v) => { onChange(v); onCommit(v); }} />
    );
  }
  if (fieldKey === 'lead_status') {
    return (
      <div>
        {leadStatusEditable(lead.processing_status, value) ? (
          <TagSelect value={value} options={leadStatusChoices(lead.processing_status, value)}
            allowEmpty={leadStatusClearable(lead.processing_status)}
            colorClass={leadStatusColor(value)}
            onCommit={(v) => { onChange(v); onCommit(v); }} />
        ) : (
          <span
            title="Статус лида ставится автоматически"
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap ${value ? leadStatusColor(value) : 'bg-gray-50 text-gray-400 border border-dashed border-gray-300'}`}
          >
            {value || '—'}
          </span>
        )}
        {onStage && <NoContactStage lead={lead} onStage={onStage} onStageDate={onStageDate} />}
        <StuckStage lead={lead} onStage={onStage} onStageDate={onStageDate} />
        <SpecialCondition lead={lead} onChange={lead.archived ? undefined : onSpecial} />
      </div>
    );
  }
  if (fieldKey === 'report_link') {
    return <LinkCell value={value} onChange={onChange} onCommit={onCommit} />;
  }
  if (fieldKey === 'contact_when') {
    const overdue = isContactOverdue(lead);
    const due = isContactDue(lead);
    return (
      <div className="space-y-0.5">
        <ContactWhenCell value={value} onChange={onChange} onCommit={onCommit} />
        {(due || overdue) && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
              overdue ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
            }`}
          >
            <Icon name={overdue ? 'AlarmClock' : 'PhoneCall'} size={10} />
            {overdue ? 'Просрочено' : 'Пора связаться'}
          </span>
        )}
      </div>
    );
  }
  const multiline = fieldKey === 'comment';
  return <EditText value={value} multiline={multiline} onChange={onChange} onCommit={onCommit} />;
}

// Ячейка «Ссылка на закл.»: по умолчанию ссылка кликабельна, рядом перо.
// По клику на перо включается режим редактирования, ссылка становится некликабельной.
function LinkCell({ value, onChange, onCommit }: {
  value: string; onChange: (v: string) => void; onCommit: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => { onCommit(e.target.value); setEditing(false); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { onCommit((e.target as HTMLInputElement).value); setEditing(false); } }}
          placeholder="https://…"
          className="w-full min-w-[130px] bg-white border border-amber-300 rounded px-1 py-0.5 text-xs outline-none"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {value ? (
        <a href={value} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate max-w-[150px] text-xs">
          {value.replace(/^https?:\/\//, '')}
        </a>
      ) : (
        <span className="text-gray-300 text-xs">—</span>
      )}
      <button
        onClick={() => setEditing(true)}
        className="shrink-0 text-gray-300 hover:text-amber-500"
        title="Редактировать ссылку"
      >
        <Icon name="Pencil" size={13} />
      </button>
    </div>
  );
}

function TagSelect({ value, options, colorClass, onCommit, allowEmpty = true }: {
  value: string; options: string[]; colorClass: string; onCommit: (v: string) => void; allowEmpty?: boolean;
}) {
  return (
    <div className="relative">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap ${value ? colorClass : 'bg-gray-50 text-gray-400 border border-dashed border-gray-300'}`}
      >
        {value || '—'}
        <Icon name="ChevronDown" size={12} className="opacity-60" />
      </span>
      <select
        value={value}
        onChange={(e) => onCommit(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      >
        {(allowEmpty || !value) && <option value="">—</option>}
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function EditText({ value, multiline, onChange, onCommit }: {
  value: string; multiline: boolean; onChange: (v: string) => void; onCommit: (v: string) => void;
}) {
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onCommit(e.target.value)}
        rows={2}
        className="w-full resize-y bg-transparent hover:bg-amber-50 focus:bg-white focus:border focus:border-amber-300 rounded px-1 py-0.5 text-xs outline-none"
      />
    );
  }
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onCommit(e.target.value)}
      className="w-full bg-transparent hover:bg-amber-50 focus:bg-white focus:border focus:border-amber-300 rounded px-1 py-0.5 text-xs outline-none"
    />
  );
}