import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { StaffTask, URGENCY_OPTIONS, Urgency } from '@/lib/staffTasksApi';

export interface TaskEditValues {
  title: string;
  description: string;
  due_date: string;
  urgency: Urgency;
}

interface Props {
  task: StaffTask;
  onSave: (v: TaskEditValues) => Promise<void>;
  onCancel: () => void;
}

const TaskEditForm = ({ task, onSave, onCancel }: Props) => {
  const [v, setV] = useState<TaskEditValues>({
    title: task.title,
    description: task.description || '',
    due_date: task.due_date ? task.due_date.slice(0, 10) : '',
    urgency: task.urgency,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!v.title.trim()) return setError('Укажите задачу');
    setBusy(true);
    setError('');
    try {
      await onSave(v);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        value={v.title}
        onChange={(e) => setV({ ...v, title: e.target.value })}
        className="w-full text-sm font-medium border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400"
      />
      <textarea
        value={v.description}
        onChange={(e) => setV({ ...v, description: e.target.value })}
        placeholder="Описание"
        rows={3}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400"
      />
      <div className="flex flex-wrap items-center gap-2">
        {URGENCY_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setV({ ...v, urgency: o.value })}
            className={`text-xs px-2.5 py-1 rounded-full border ${v.urgency === o.value ? o.activeClass : 'border-gray-200 text-gray-600'}`}
          >
            {o.label}
          </button>
        ))}
        <label className="flex items-center gap-1 text-xs text-gray-500">
          <Icon name="Calendar" size={13} />
          до
          <input
            type="date"
            value={v.due_date}
            onChange={(e) => setV({ ...v, due_date: e.target.value })}
            className="border border-gray-200 rounded-md px-2 py-0.5 text-xs"
          />
        </label>
      </div>
      {error && <div className="text-xs text-rose-600">{error}</div>}
      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={save}
          className="text-sm bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
        >
          Сохранить
        </button>
        <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">
          Отмена
        </button>
      </div>
    </div>
  );
};

export default TaskEditForm;
