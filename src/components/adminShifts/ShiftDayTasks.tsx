import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { ShiftAdmin } from '@/lib/adminShiftsApi';

export interface PlannedTask {
  id: string;
  title: string;
  staff_id: number;
  done: boolean;
}

interface Props {
  admins: ShiftAdmin[];
  tasks: PlannedTask[];
  onChange: (tasks: PlannedTask[]) => void;
}

const shortName = (full: string) => {
  const [last, first] = full.split(' ');
  return first ? `${last} ${first[0]}.` : full;
};

/** Задачи, которые руководитель ставит администраторам на конкретный день */
const ShiftDayTasks = ({ admins, tasks, onChange }: Props) => {
  const [title, setTitle] = useState('');
  const [staffId, setStaffId] = useState<number>(admins[0]?.id || 0);

  const add = () => {
    const text = title.trim();
    if (!text || !staffId) return;
    onChange([...tasks, { id: `${Date.now()}`, title: text, staff_id: staffId, done: false }]);
    setTitle('');
  };

  const remove = (id: string) => onChange(tasks.filter((t) => t.id !== id));

  const nameOf = (id: number) => {
    const a = admins.find((x) => x.id === id);
    return a ? shortName(a.full_name) : '';
  };

  return (
    <div className="space-y-3 pt-1 border-t border-gray-100">
      <div className="text-xs font-medium text-gray-500 uppercase pt-3">Задачи на день</div>

      {tasks.length === 0 && (
        <div className="text-xs text-gray-400">
          Задач пока нет. Добавьте, что нужно сделать администратору в этот день.
        </div>
      )}

      {tasks.length > 0 && (
        <ul className="space-y-1.5">
          {tasks.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 text-sm"
            >
              <Icon name="ClipboardList" size={16} className="text-amber-500 shrink-0" />
              <span className="flex-1 truncate text-gray-800">{t.title}</span>
              <span className="text-[11px] text-gray-400 whitespace-nowrap">
                {nameOf(t.staff_id)}
              </span>
              <button
                onClick={() => remove(t.id)}
                className="text-gray-300 hover:text-red-500"
                title="Удалить задачу"
              >
                <Icon name="Trash2" size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Что нужно сделать"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
        />
        <select
          value={staffId}
          onChange={(e) => setStaffId(Number(e.target.value))}
          className="w-36 border border-gray-200 rounded-xl px-2 py-2 text-sm"
        >
          {admins.map((a) => (
            <option key={a.id} value={a.id}>
              {shortName(a.full_name)}
            </option>
          ))}
        </select>
        <button
          onClick={add}
          className="px-3 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-colors"
          title="Добавить задачу"
        >
          <Icon name="Plus" size={18} />
        </button>
      </div>
    </div>
  );
};

export default ShiftDayTasks;