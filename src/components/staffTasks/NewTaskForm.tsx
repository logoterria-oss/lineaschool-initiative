import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Assignee, TaskFile, URGENCY_OPTIONS, Urgency, createTask, uploadTaskFile } from '@/lib/staffTasksApi';
import TaskAttachments from './TaskAttachments';

interface Props {
  assignees: Assignee[];
  onCreated: () => void;
  problem?: boolean;
}

const NewTaskForm = ({ assignees, onCreated, problem }: Props) => {
  const [reporter, setReporter] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('medium');
  const [ids, setIds] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setUploading(true);
    setError('');
    try {
      for (const f of Array.from(list)) {
        if (f.size > 10 * 1024 * 1024) {
          setError(`«${f.name}» больше 10 МБ`);
          continue;
        }
        const up = await uploadTaskFile(f);
        setFiles((p) => [...p, up]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить файл');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };
  const [error, setError] = useState('');

  const toggle = (id: number) => setIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const submit = async () => {
    if (problem && !reporter.trim()) return setError('Укажите вашу фамилию и имя');
    if (!title.trim()) return setError(problem ? 'Опишите проблему' : 'Напишите задачу');
    if (!ids.length) return setError('Выберите исполнителя');
    setBusy(true);
    setError('');
    try {
      await createTask({ title, description, due_date: '', urgency, assignee_ids: ids, attachments: files, reporter_name: problem ? reporter : undefined });
      setTitle('');
      setDescription('');
      setUrgency('medium');
      setIds([]);
      setFiles([]);
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
        <Icon name={problem ? 'TriangleAlert' : 'Plus'} size={18} className="text-purple-600" /> {problem ? 'Сообщить о проблеме' : 'Новая задача'}
      </div>
      {problem && (
        <input
          value={reporter}
          onChange={(e) => setReporter(e.target.value)}
          placeholder="Ваши фамилия и имя"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
        />
      )}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={problem ? 'В чём проблема' : 'Что нужно сделать'}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Подробности (необязательно)"
        rows={3}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
      />
      <div className="space-y-2">
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <button
          type="button"
          disabled={uploading || files.length >= 10}
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 text-sm text-purple-700 hover:text-purple-800 disabled:opacity-50"
        >
          <Icon name={uploading ? 'Loader2' : 'Paperclip'} size={16} className={uploading ? 'animate-spin' : ''} />
          {uploading ? 'Загружаю…' : 'Прикрепить файл или фото'}
          <span className="text-xs text-gray-400">до 10 МБ</span>
        </button>
        <TaskAttachments files={files} onRemove={(i) => setFiles((p) => p.filter((_, j) => j !== i))} />
      </div>
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
                {a.role === 'shift' && <Icon name="Clock" size={13} className="inline mr-1 -mt-0.5" />}
                {a.label || a.full_name}
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
        <button
          disabled={busy || uploading}
          onClick={submit}
          className="ml-auto bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {busy ? 'Отправляю…' : problem ? 'Отправить' : 'Поставить задачу'}
        </button>
      </div>
      {error && <div className="text-sm text-rose-600">{error}</div>}
    </div>
  );
};

export default NewTaskForm;
