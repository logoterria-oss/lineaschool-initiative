import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { TaskComment } from '@/lib/staffTasksApi';

interface Props {
  comments: TaskComment[];
  onAdd: (text: string) => Promise<void>;
}

const TaskComments = ({ comments, onAdd }: Props) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setError('');
    try {
      await onAdd(text.trim());
      setText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
      >
        <Icon name="MessageSquare" size={13} />
        {comments.length > 0 ? `Комментарии (${comments.length})` : 'Написать комментарий'}
        <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={13} />
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2 text-xs text-gray-500 mb-0.5">
                <span className="font-medium text-gray-700">{c.author_name}</span>
                <span>{c.created_msk}</span>
              </div>
              <div className="text-gray-800 whitespace-pre-line">{c.text}</div>
            </div>
          ))}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ваш комментарий"
            rows={2}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400"
          />
          {error && <div className="text-xs text-rose-600">{error}</div>}
          <button
            disabled={busy || !text.trim()}
            onClick={send}
            className="text-sm bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 flex items-center gap-1.5"
          >
            {busy ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}
            Отправить
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskComments;
