import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Admin, StudentComment, saveComment, deleteComment } from '@/lib/studentsApi';
import { fmtDate } from './studentsTableHelpers';

interface Draft {
  id?: number;
  executor_id: number | null;
  comment_date: string;
  done: string;
  parent_reply: string;
  extra: string;
}

const emptyDraft = (): Draft => ({
  executor_id: null,
  comment_date: new Date().toISOString().slice(0, 10),
  done: '',
  parent_reply: '',
  extra: '',
});

const CommentForm = ({
  admins,
  initial,
  onSave,
  onCancel,
}: {
  admins: Admin[];
  initial: Draft;
  onSave: (d: Draft) => Promise<void>;
  onCancel: () => void;
}) => {
  const [d, setD] = useState<Draft>(initial);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof Draft, v: string | number | null) => setD((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setSaving(true);
    try {
      await onSave(d);
    } finally {
      setSaving(false);
    }
  };

  const field = 'w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-300';

  return (
    <div className="bg-purple-50/60 border border-purple-100 rounded-lg p-2.5 space-y-2">
      <div className="flex gap-2">
        <select
          value={d.executor_id ?? ''}
          onChange={(e) => set('executor_id', e.target.value ? Number(e.target.value) : null)}
          className={`${field} flex-1 ${d.executor_id ? '' : 'border-purple-400 ring-1 ring-purple-300'}`}
        >
          <option value="">Исполнитель</option>
          {admins.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={d.comment_date}
          onChange={(e) => set('comment_date', e.target.value)}
          className={`${field} w-32`}
        />
      </div>
      <textarea
        value={d.done}
        onChange={(e) => set('done', e.target.value)}
        placeholder="Что сделано"
        rows={2}
        className={field}
      />
      <textarea
        value={d.parent_reply}
        onChange={(e) => set('parent_reply', e.target.value)}
        placeholder="Ответ родителя"
        rows={2}
        className={field}
      />
      <textarea
        value={d.extra}
        onChange={(e) => set('extra', e.target.value)}
        placeholder="Доп. комментарий"
        rows={1}
        className={field}
      />
      {!d.executor_id && (
        <div className="text-[11px] text-purple-600">Выберите исполняющего</div>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={saving || !d.executor_id} className="h-7 text-xs">
          {saving ? '…' : 'Сохранить'}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} className="h-7 text-xs">Отмена</Button>
      </div>
    </div>
  );
};

const CommentView = ({
  c,
  admins,
  onEdit,
  onDelete,
}: {
  c: StudentComment;
  admins: Admin[];
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const admin = admins.find((a) => a.id === c.executor_id);
  const color = admin?.color || '#6b7280';
  const name = admin?.name || c.executor_name || 'Исполнитель';

  return (
    <div className="border-l-2 pl-2 py-1 group/comment" style={{ borderColor: color }}>
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold text-white truncate"
            style={{ backgroundColor: color }}
          >
            {name}
          </span>
          {c.comment_date && (
            <span className="text-[11px] text-gray-400 whitespace-nowrap">{fmtDate(c.comment_date)}</span>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={onEdit} className="text-gray-400 hover:text-purple-600" title="Редактировать">
            <Icon name="Pencil" size={12} />
          </button>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-500" title="Удалить">
            <Icon name="Trash2" size={12} />
          </button>
        </div>
      </div>
      {c.done && <div className="text-xs text-gray-700 mt-0.5"><b>Сделано:</b> {c.done}</div>}
      {c.parent_reply && <div className="text-xs text-gray-600"><b>Родитель:</b> {c.parent_reply}</div>}
      {c.extra && <div className="text-xs text-gray-500 italic">{c.extra}</div>}
    </div>
  );
};

const CommentsCell = ({
  studentId,
  initial,
  admins,
}: {
  studentId: number;
  initial: StudentComment[];
  admins: Admin[];
}) => {
  const [list, setList] = useState<StudentComment[]>(initial);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const handleSave = async (d: Draft) => {
    const executor = admins.find((a) => a.id === d.executor_id);
    const id = await saveComment(studentId, {
      id: d.id,
      executor_id: d.executor_id,
      executor_name: executor?.name ?? null,
      comment_date: d.comment_date || null,
      done: d.done,
      parent_reply: d.parent_reply,
      extra: d.extra,
    });
    const saved: StudentComment = {
      id,
      executor_id: d.executor_id,
      executor_name: executor?.name ?? null,
      comment_date: d.comment_date || null,
      done: d.done,
      parent_reply: d.parent_reply,
      extra: d.extra,
    };
    setList((prev) => {
      const exists = prev.some((c) => c.id === id);
      return exists ? prev.map((c) => (c.id === id ? saved : c)) : [saved, ...prev];
    });
    setAdding(false);
    setEditId(null);
  };

  const handleDelete = async (id: number) => {
    await deleteComment(id);
    setList((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <td className="px-3 py-3 align-top" style={{ minWidth: 260, maxWidth: 340 }}>
      <div className="space-y-1.5">
        {list.map((c) =>
          editId === c.id ? (
            <CommentForm
              key={c.id}
              admins={admins}
              initial={{
                id: c.id,
                executor_id: c.executor_id,
                comment_date: c.comment_date || new Date().toISOString().slice(0, 10),
                done: c.done,
                parent_reply: c.parent_reply,
                extra: c.extra,
              }}
              onSave={handleSave}
              onCancel={() => setEditId(null)}
            />
          ) : (
            <CommentView
              key={c.id}
              c={c}
              admins={admins}
              onEdit={() => { setAdding(false); setEditId(c.id); }}
              onDelete={() => handleDelete(c.id)}
            />
          ),
        )}

        {adding ? (
          <CommentForm
            admins={admins}
            initial={emptyDraft()}
            onSave={handleSave}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button
            onClick={() => { setEditId(null); setAdding(true); }}
            className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800"
          >
            <Icon name="Plus" size={13} />
            Добавить
          </button>
        )}
      </div>
    </td>
  );
};

export default CommentsCell;