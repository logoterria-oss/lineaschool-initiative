import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { StaffTask, URGENCY_OPTIONS } from '@/lib/staffTasksApi';

const TaskOriginal = ({ task }: { task: StaffTask }) => {
  const [open, setOpen] = useState(false);
  const o = task.original;
  if (!o) return null;
  const urg = URGENCY_OPTIONS.find((u) => u.value === o.urgency);

  return (
    <div className="mt-2">
      <button onClick={() => setOpen((v) => !v)} className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1">
        <Icon name="History" size={13} />
        изменено{task.edited_msk ? ` ${task.edited_msk}` : ''} · {open ? 'скрыть' : 'показать'} первоначальную версию
      </button>
      {open && (
        <div className="mt-1.5 border border-dashed border-gray-300 bg-gray-50 rounded-lg px-3 py-2 text-sm">
          <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Первоначальная версия</div>
          <div className="font-medium text-gray-800">{o.title}</div>
          {o.description && <div className="text-gray-600 mt-1 whitespace-pre-line">{o.description}</div>}
          <div className="flex flex-wrap gap-x-3 mt-1 text-xs text-gray-500">
            {urg && <span>{urg.label}</span>}
            {o.due_date && <span>до {new Date(o.due_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskOriginal;
