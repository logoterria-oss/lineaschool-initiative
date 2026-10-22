import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { StaffTask, TasksData, deleteTask, fetchTasks, setTaskDone } from '@/lib/staffTasksApi';
import TaskCard from './TaskCard';
import NewTaskForm from './NewTaskForm';

type Tab = 'mine' | 'given';

const StaffTasksView = () => {
  const [data, setData] = useState<TasksData | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('mine');
  const [who, setWho] = useState<number | 'all'>('all');
  const [showDone, setShowDone] = useState(false);

  const load = useCallback(() => {
    fetchTasks()
      .then((d) => {
        setData(d);
        setTab((t) => (d.can_assign && t === 'mine' && !d.mine.length ? 'given' : t));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'));
  }, []);

  useEffect(load, [load]);

  if (error) return <div className="bg-white rounded-xl border border-gray-200 p-5 text-sm text-rose-600">{error}</div>;
  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
        <Icon name="Loader2" size={20} className="animate-spin mx-auto mb-1" /> Загружаю задачи…
      </div>
    );
  }

  const onToggle = async (t: StaffTask, done: boolean, comment: string) => {
    await setTaskDone(t.id, done, comment);
    load();
  };
  const onDelete = async (t: StaffTask) => {
    await deleteTask(t.id);
    load();
  };

  const isGiven = tab === 'given';
  let list = isGiven ? data.given : data.mine;
  if (isGiven && who !== 'all') list = list.filter((t) => t.assignee_id === who);
  const open = list.filter((t) => t.status === 'open');
  const done = list.filter((t) => t.status === 'done');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-semibold text-gray-900">Задачи</h2>
        {data.can_assign && (
          <div className="flex bg-gray-100 rounded-lg p-1 text-sm">
            {([['given', `Поставленные мной (${data.given.filter((t) => t.status === 'open').length})`], ['mine', `Мне (${data.mine.filter((t) => t.status === 'open').length})`]] as [Tab, string][]).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-3 py-1.5 rounded-md ${tab === k ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-600'}`}
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      {isGiven && <NewTaskForm assignees={data.assignees} onCreated={load} />}

      {isGiven && data.assignees.length > 0 && (
        <div className="flex flex-wrap gap-2 text-sm">
          {[{ id: 'all' as const, full_name: 'Все' }, ...data.assignees].map((a) => (
            <button
              key={a.id}
              onClick={() => setWho(a.id)}
              className={`px-3 py-1 rounded-full ${who === a.id ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
            >
              {a.full_name}
            </button>
          ))}
        </div>
      )}

      {open.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
          {isGiven ? 'Открытых задач нет' : 'Задач пока нет — всё сделано'}
        </div>
      ) : (
        <div className="space-y-2">
          {open.map((t) => (
            <TaskCard key={t.id} task={t} showAssignee={isGiven} onToggle={onToggle} onDelete={isGiven ? onDelete : undefined} />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div>
          <button onClick={() => setShowDone((v) => !v)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <Icon name={showDone ? 'ChevronUp' : 'ChevronDown'} size={16} /> Выполненные ({done.length})
          </button>
          {showDone && (
            <div className="space-y-2 mt-2">
              {done.map((t) => (
                <TaskCard key={t.id} task={t} showAssignee={isGiven} onToggle={onToggle} onDelete={isGiven ? onDelete : undefined} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffTasksView;
