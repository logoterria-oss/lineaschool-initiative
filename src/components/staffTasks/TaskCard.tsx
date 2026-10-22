import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { StaffTask, URGENCY_OPTIONS, Urgency } from '@/lib/staffTasksApi';

interface Props {
  task: StaffTask;
  showAssignee?: boolean;
  onToggle: (t: StaffTask, done: boolean, comment: string) => Promise<void>;
  onDelete?: (t: StaffTask) => Promise<void>;
  onUrgency?: (t: StaffTask, u: Urgency) => Promise<void>;
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

const TaskCard = ({ task, showAssignee, onToggle, onDelete, onUrgency }: Props) => {
  const [comment, setComment] = useState('');
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const done = task.status === 'done';
  const today = new Date().toISOString().slice(0, 10);
  const overdue = !done && task.due_date && task.due_date < today;
  const urg = URGENCY_OPTIONS.find((o) => o.value === task.urgency) || URGENCY_OPTIONS[1];
  const [picking, setPicking] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl border p-4 ${done ? 'border-gray-100 opacity-70' : overdue ? 'border-rose-200' : 'border-gray-200'} ${!done && task.urgency === 'urgent' ? 'border-l-4 border-l-red-500' : ''}`}>
      <div className="flex items-start gap-3">
        <button
          disabled={busy}
          onClick={() => (done ? run(() => onToggle(task, false, '')) : setAsking((v) => !v))}
          className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 hover:border-emerald-500'
          }`}
          title={done ? 'Вернуть в работу' : 'Отметить выполненной'}
        >
          {done && <Icon name="Check" size={16} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <div className={`font-medium text-gray-900 ${done ? 'line-through' : ''}`}>{task.title}</div>
            {onUrgency && !done ? (
              <span className="relative">
                <button
                  onClick={() => setPicking((v) => !v)}
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${urg.badgeClass}`}
                  title={`${urg.hint} · нажмите, чтобы изменить`}
                >
                  {urg.label}
                </button>
                {picking && (
                  <span className="absolute z-10 left-0 top-6 bg-white border border-gray-200 rounded-lg shadow-md p-1 flex flex-col min-w-[220px]">
                    {URGENCY_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        onClick={() => { setPicking(false); if (o.value !== task.urgency) run(() => onUrgency(task, o.value)); }}
                        className="text-left text-sm px-2 py-1.5 rounded hover:bg-gray-50 flex items-start gap-2"
                      >
                        <span className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${o.activeClass.split(' ')[0]}`} />
                        <span>
                          <span className="block">{o.label}</span>
                          <span className="block text-[11px] text-gray-500 leading-tight">{o.hint}</span>
                        </span>
                      </button>
                    ))}
                  </span>
                )}
              </span>
            ) : (
              <span title={urg.hint} className={`text-xs font-medium px-2 py-0.5 rounded-full ${urg.badgeClass}`}>{urg.label}</span>
            )}
          </div>
          {task.description && <div className="text-sm text-gray-600 mt-1 whitespace-pre-line">{task.description}</div>}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
            {showAssignee ? (
              <span className="flex items-center gap-1"><Icon name="User" size={13} />{task.assignee_name}</span>
            ) : (
              <span className="flex items-center gap-1"><Icon name="UserCheck" size={13} />от {task.author_name}</span>
            )}
            {task.due_date && (
              <span className={`flex items-center gap-1 ${overdue ? 'text-rose-600 font-medium' : ''}`}>
                <Icon name="Calendar" size={13} />до {fmtDate(task.due_date)}{overdue && ' · просрочено'}
              </span>
            )}
            {done && task.done_at && (
              <span className="flex items-center gap-1 text-emerald-600"><Icon name="CheckCheck" size={13} />выполнено {fmtDate(task.done_at)}</span>
            )}
          </div>
          {done && task.done_comment && (
            <div className="mt-2 text-sm bg-emerald-50 text-emerald-900 rounded-lg px-3 py-2">{task.done_comment}</div>
          )}
          {asking && !done && (
            <div className="mt-3 space-y-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Комментарий к выполнению (необязательно)"
                rows={2}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400"
              />
              <div className="flex gap-2">
                <button
                  disabled={busy}
                  onClick={() => run(async () => { await onToggle(task, true, comment); setAsking(false); setComment(''); })}
                  className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                >
                  Выполнено
                </button>
                <button onClick={() => setAsking(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
        {onDelete && (
          <button
            disabled={busy}
            onClick={() => window.confirm('Удалить задачу?') && run(() => onDelete(task))}
            className="text-gray-300 hover:text-rose-500 flex-shrink-0"
            title="Удалить"
          >
            <Icon name="Trash2" size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
