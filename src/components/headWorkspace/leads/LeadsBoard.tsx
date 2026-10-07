import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Lead, PROCESSING_OPTIONS } from '@/lib/leadsApi';
import { leadStatusColor } from './leadColors';
import { isUntouched } from './leadUtils';

interface Props {
  leads: Lead[];
  onMove: (id: number, status: string) => void;
  onComment: (id: number, comment: string) => void;
}

const NONE = '';

// Цвет заголовка и полоски колонки — по этапу воронки.
const COLUMN_STYLE: Record<string, { title: string; bar: string }> = {
  [NONE]: { title: 'text-gray-700', bar: 'bg-gray-300' },
  'Списались (ответ не получен)': { title: 'text-gray-600', bar: 'bg-gray-400' },
  'Списались (ответ получен)': { title: 'text-gray-800', bar: 'bg-gray-500' },
  'Заполнена анкета': { title: 'text-yellow-700', bar: 'bg-yellow-400' },
  'Запланирована диагностика (не оплачено)': { title: 'text-orange-600', bar: 'bg-orange-300' },
  'Запланирована диагностика (оплачено)': { title: 'text-orange-700', bar: 'bg-orange-500' },
  'Проведена диагностика': { title: 'text-cyan-700', bar: 'bg-cyan-500' },
  'Утверждено расписание': { title: 'text-blue-700', bar: 'bg-blue-500' },
  'Оплачен абонемент': { title: 'text-green-700', bar: 'bg-green-600' },
  'Клиент добавлен в мессенджер': { title: 'text-green-600', bar: 'bg-green-400' },
};

function fmtDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function LeadTile({ lead, onComment, onDragStart }: {
  lead: Lead;
  onComment: (c: string) => void;
  onDragStart: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(lead.comment || '');
  const untouched = isUntouched(lead);
  const moved = fmtDate(lead.status_changed_at);

  return (
    <div
      draggable={!editing}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(lead.id));
        onDragStart();
      }}
      className={`rounded-lg border bg-white p-2.5 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${
        untouched ? 'border-red-300 bg-red-50' : 'border-gray-200'
      }`}
    >
      <div className="font-semibold text-sm text-gray-900 leading-snug">
        {lead.student_name || <span className="text-gray-400 font-normal">Ученик не указан</span>}
      </div>
      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
        <Icon name="User" size={11} className="shrink-0" />
        <span className="truncate">{lead.parent_name || '—'}</span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
        <div className="text-gray-500">
          <div className="text-gray-400">Заявка</div>
          <div className="font-medium text-gray-700">{lead.request_date || '—'}</div>
        </div>
        <div className="text-gray-500">
          <div className="text-gray-400">В колонке с</div>
          <div className="font-medium text-gray-700">{moved || '—'}</div>
        </div>
      </div>

      {lead.lead_status && (
        <span className={`inline-block mt-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${leadStatusColor(lead.lead_status)}`}>
          {lead.lead_status}
        </span>
      )}

      <div className="mt-2 border-t border-gray-100 pt-1.5">
        {editing ? (
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => {
              setEditing(false);
              if (text !== (lead.comment || '')) onComment(text);
            }}
            rows={3}
            className="w-full resize-y border border-amber-300 rounded px-1.5 py-1 text-xs outline-none"
          />
        ) : (
          <button
            onClick={() => { setText(lead.comment || ''); setEditing(true); }}
            className="w-full text-left text-xs text-gray-600 hover:bg-amber-50 rounded px-1 py-0.5 whitespace-pre-wrap break-words"
            title="Изменить комментарий"
          >
            {lead.comment || <span className="text-gray-300 italic">+ комментарий</span>}
          </button>
        )}
      </div>
    </div>
  );
}

// Доска лидов: колонки по статусу обработки, как воронка в CRM.
// Карточку можно перетащить в другую колонку — статус обработки сменится.
export default function LeadsBoard({ leads, onMove, onComment }: Props) {
  const [dragId, setDragId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  const known = new Set(PROCESSING_OPTIONS);
  const columns = [NONE, ...PROCESSING_OPTIONS];
  const byCol: Record<string, Lead[]> = Object.fromEntries(columns.map((c) => [c, []]));
  for (const l of leads) {
    const ps = (l.processing_status || '').trim();
    (known.has(ps) ? byCol[ps] : byCol[NONE]).push(l);
  }

  const drop = (col: string) => {
    if (dragId != null) {
      const lead = leads.find((l) => l.id === dragId);
      if (lead && (lead.processing_status || '') !== col) onMove(dragId, col);
    }
    setDragId(null);
    setOverCol(null);
  };

  return (
    <div className="overflow-x-auto pb-3">
      <div className="flex gap-3 min-w-max items-start">
        {columns.map((col) => {
          const st = COLUMN_STYLE[col] || COLUMN_STYLE[NONE];
          const items = byCol[col];
          const isOver = overCol === col && dragId != null;
          return (
            <div
              key={col || 'none'}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col); }}
              onDragLeave={() => setOverCol((c) => (c === col ? null : c))}
              onDrop={(e) => { e.preventDefault(); drop(col); }}
              className={`w-[270px] shrink-0 rounded-xl border transition-colors ${
                isOver ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="px-3 pt-2.5 pb-2 sticky top-0">
                <div className={`h-1 rounded-full mb-2 ${st.bar}`} />
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`text-sm font-bold leading-tight ${st.title}`}>
                    {col || 'Не разобрано'}
                  </h3>
                  <span className="text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                    {items.length}
                  </span>
                </div>
              </div>
              <div className="px-2 pb-2 space-y-2 max-h-[65vh] overflow-y-auto">
                {items.length === 0 ? (
                  <div className="text-center text-xs text-gray-400 py-6 border border-dashed border-gray-200 rounded-lg">
                    нет лидов
                  </div>
                ) : (
                  items.map((l) => (
                    <LeadTile
                      key={l.id}
                      lead={l}
                      onDragStart={() => setDragId(l.id)}
                      onComment={(c) => onComment(l.id, c)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
