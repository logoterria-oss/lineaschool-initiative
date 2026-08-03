import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Lead } from '@/lib/leadsApi';

const CONTACTED_STATUS = 'Списались (ответ не получен)';

interface Props {
  leads: Lead[];
  onContacted: (id: number) => void;
}

export default function NewLeadsPanel({ leads, onContacted }: Props) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [open, setOpen] = useState(true);

  if (leads.length === 0) return null;

  const handleContacted = async (id: number) => {
    setBusyId(id);
    try {
      await onContacted(id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mb-5 rounded-xl border border-red-200 bg-red-50/60 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white">
          <Icon name="Sparkles" size={16} />
        </span>
        <span className="font-semibold text-red-700">Новые лиды</span>
        <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
          {leads.length}
        </span>
        <Icon
          name={open ? 'ChevronUp' : 'ChevronDown'}
          size={18}
          className="ml-auto text-red-400"
        />
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          {leads.map((l) => (
            <div
              key={l.id}
              className="flex items-center gap-3 rounded-lg border border-red-100 bg-white px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-gray-800">
                  {l.student_name || l.parent_name || 'Без имени'}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                  {l.parent_name && l.student_name && (
                    <span className="truncate">Родитель: {l.parent_name}</span>
                  )}
                  {l.contact && <span className="truncate">{l.contact}</span>}
                  {l.request_date && <span>Заявка: {l.request_date}</span>}
                </div>
              </div>
              <button
                onClick={() => handleContacted(l.id)}
                disabled={busyId === l.id}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
              >
                {busyId === l.id ? (
                  <Icon name="Loader2" size={15} className="animate-spin" />
                ) : (
                  <Icon name="Check" size={15} />
                )}
                Списались
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { CONTACTED_STATUS };
