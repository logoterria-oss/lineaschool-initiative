import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import TaskCard from '@/components/staffTasks/TaskCard';
import { StaffTask, addTaskComment, fetchShiftTasks, setTaskDone } from '@/lib/staffTasksApi';

/** Задачи «Админ на смене»: открытые и закрытые за сутки, общие для всех */
const ShiftTasksBlock = ({ onCount }: { onCount?: (n: number) => void }) => {
  const [tasks, setTasks] = useState<StaffTask[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    fetchShiftTasks()
      .then((list) => {
        setTasks(list);
        setError('');
        onCount?.(list.filter((t) => t.status === 'open').length);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'));
  }, [onCount]);

  useEffect(() => {
    load();
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 60000);
    return () => window.clearInterval(t);
  }, [load]);

  if (error) return <div className="text-sm text-rose-600">{error}</div>;
  if (!tasks) {
    return (
      <div className="text-sm text-gray-400 flex items-center gap-2">
        <Icon name="Loader2" size={14} className="animate-spin" /> Загружаем задачи…
      </div>
    );
  }
  if (tasks.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-green-600">
        <Icon name="Check" size={15} /> Задач для админа на смене нет
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((t) => (
        <TaskCard
          key={t.id}
          task={t}
          onToggle={async (task, done, comment) => {
            await setTaskDone(task.id, done, comment);
            load();
          }}
          onComment={async (task, text) => {
            await addTaskComment(task.id, text);
            load();
          }}
        />
      ))}
    </div>
  );
};

export default ShiftTasksBlock;
