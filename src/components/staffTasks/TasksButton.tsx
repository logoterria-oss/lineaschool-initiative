import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { fetchTasks } from '@/lib/staffTasksApi';

interface Props {
  active: boolean;
  onClick: () => void;
  refreshKey?: unknown;
}

export const TASKS_ITEM = { id: 'tasks', label: 'Задачи', kind: 'component' as const, icon: 'SquareCheckBig' };

const TasksButton = ({ active, onClick, refreshKey }: Props) => {
  const [open, setOpen] = useState(0);
  const [urgent, setUrgent] = useState(0);

  useEffect(() => {
    const load = () =>
      fetchTasks()
        .then((d) => {
          const mine = d.mine.filter((t) => t.status === 'open');
          setOpen(mine.length);
          setUrgent(mine.filter((t) => t.urgency === 'urgent').length);
        })
        .catch(() => undefined);
    load();
    const id = window.setInterval(load, 60000);
    return () => window.clearInterval(id);
  }, [refreshKey]);

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 text-white text-sm font-semibold px-4 py-3 rounded-2xl shadow-sm transition-colors ${
        active ? 'bg-green-700' : 'bg-green-500 hover:bg-green-600'
      }`}
    >
      <Icon name="SquareCheckBig" size={16} className="flex-shrink-0" />
      <span>Задачи</span>
      {open > 0 && (
        <span
          title={urgent ? `Открытых: ${open}, из них срочных: ${urgent}` : `Открытых задач: ${open}`}
          className={`inline-flex items-center text-[11px] font-bold rounded-full px-1.5 py-0.5 ${
            urgent ? 'bg-red-600 text-white' : 'bg-white text-green-700'
          }`}
        >
          {open}
        </span>
      )}
    </button>
  );
};

export default TasksButton;
