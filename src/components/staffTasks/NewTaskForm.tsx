import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Assignee, URGENCY_OPTIONS, Urgency, createTask } from '@/lib/staffTasksApi';

interface Props {
  assignees: Assignee[];
  onCreated: () => void;
}

const NewTaskForm = ({ assignees, onCreated }: Props) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [due, setDue] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('medium');
  const [ids, setIds] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const toggle = (id: number) => setIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const submit = async () => {
    if (!title.trim()) return setError('Напишите задачу');
    if (!ids.length) return setError('Выберите исполнителя');
    setBusy(true);
    setError('');
    try {
      await createTask({ title, description, due_date: due, urgency, assignee_ids: ids });
      setTitle('');
      setDescription('');
      setDue('');
      setUrgency('medium');
      setIds([]);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="font-medium text-gray-900 flex items-center gap-2">
        <Icon name="Plus" size={18} className="text-purple-600" /> Новая задача
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Что нужно сделать"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Подробности (необязательно)"
        rows={3}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
      />
      <div>
        <div className="text-xs text-gray-500 mb-1.5">Кому</div>
        <div className="flex flex-wrap gap-2">
          {assignees.map((a) => {
            const on = ids.includes(a.id);
            return (
              <button
                key={a.id}
                onClick={() => toggle(a.id)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  on ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300'
                }`}
              >
                {a.full_name}
                {a.job_title && <span className={on ? 'text-purple-100' : 'text-gray-400'}> · {a.job_title}</span>}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="text-xs text-gray-500 mb-1.5">Срочность</div>
        <div className="flex flex-wrap gap-2">
          {URGENCY_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setUrgency(o.value)}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors flex flex-col items-start text-left ${
                urgency === o.value ? o.activeClass : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">{o.label}</span>
              <span className={`text-[11px] leading-tight ${urgency === o.value ? 'text-white/85' : 'text-gray-500'}`}>{o.hint}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-gray-500">
          Срок
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="block mt-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-900"
          />
        </label>
        <button
          disabled={busy}
          onClick={submit}
          className="ml-auto bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {busy ? 'Сохраняю…' : 'Поставить задачу'}
        </button>
      </div>
      {error && <div className="text-sm text-rose-600">{error}</div>}
    </div>
  );
};

export default NewTaskForm;
