import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { StaffTask, TasksData, Urgency, deleteTask, fetchTasks, setTaskDone, setTaskUrgency } from '@/lib/staffTasksApi';
import TaskCard from './TaskCard';
import NewTaskForm from './NewTaskForm';

type Tab = 'mine' | 'given';

const StaffTasksView = ({ problemMode = false }: { problemMode?: boolean }) => {
  const [data, setData] = useState<TasksData | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>(problemMode ? 'given' : 'mine');
  const [who, setWho] = useState<number | 'all'>('all');
  const [showDone, setShowDone] = useState(false);

  const load = useCallback(() => {
    fetchTasks()
      .then(setData)
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
  const onUrgency = async (t: StaffTask, u: Urgency) => {
    await setTaskUrgency(t.id, u);
    load();
  };
  const onDelete = async (t: StaffTask) => {
    await deleteTask(t.id);
    load();
  };

  const isGiven = tab === 'given';
  let list = isGiven ? data.given : data.mine;
  if (isGiven && who !== 'all') list = list.filter((t) => (who === 0 ? t.for_shift : !t.for_shift && t.assignee_id === who));
  const open = list.filter((t) => t.status === 'open');
  const done = list.filter((t) => t.status === 'done');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-semibold text-gray-900">{problemMode ? 'Мои обращения' : 'Задачи'}</h2>
        {data.can_assign && !problemMode && (
          <div className="flex bg-gray-100 rounded-lg p-1 text-sm">
            {([['mine', `Мои (${data.mine.filter((t) => t.status === 'open').length})`], ['given', `Поставить задачу (${data.given.filter((t) => t.status === 'open').length})`]] as [Tab, string][]).map(([k, l]) => (
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

      {isGiven && <NewTaskForm assignees={data.assignees} onCreated={load} problem={problemMode} />}

      {isGiven && data.assignees.length > 0 && (
        <div className="flex flex-wrap gap-2 text-sm">
          {[{ id: 'all' as const, label: 'Все' }, ...data.assignees].map((a) => (
            <button
              key={a.id}
              onClick={() => setWho(a.id)}
              className={`px-3 py-1 rounded-full ${who === a.id ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {open.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
          {problemMode ? 'Открытых обращений нет' : isGiven ? 'Открытых задач нет' : 'Задач пока нет — всё сделано'}
        </div>
      ) : (
        <div className="space-y-4">
          {(isGiven
            ? [{ key: 'all', title: '', items: open }]
            : [
                { key: 'personal', title: 'Мои задачи', items: open.filter((t) => !t.for_shift) },
                { key: 'shift', title: 'Задачи для админа на смене', items: open.filter((t) => t.for_shift) },
              ].filter((g) => g.items.length > 0)
          ).map((g, _i, arr) => (
            <div key={g.key} className="space-y-2">
              {g.title && (arr.length > 1 || g.key === 'shift') && (
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Icon name={g.key === 'shift' ? 'Clock' : 'User'} size={16} className="text-purple-600" />
                  {g.title} <span className="text-gray-400 font-normal">({g.items.length})</span>
                </div>
              )}
              {g.items.map((t) => (
                <TaskCard key={t.id} task={t} showAssignee={isGiven} onToggle={onToggle} onDelete={isGiven || (!t.for_shift && t.author_id === t.assignee_id) ? onDelete : undefined} onUrgency={isGiven || (!t.for_shift && t.author_id === t.assignee_id) ? onUrgency : undefined} />
              ))}
            </div>
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