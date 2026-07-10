import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  InteractionSource,
  InteractionReply,
  StudentInteraction,
  saveInteraction,
  deleteInteraction,
} from '@/lib/studentsApi';
import { fmtDate } from './studentsTableHelpers';

const SOURCES: { id: InteractionSource; label: string; color: string }[] = [
  { id: 'parent', label: 'Родитель', color: '#7c3aed' },
  { id: 'teacher', label: 'Педагог', color: '#0891b2' },
  { id: 'admin', label: 'Админ', color: '#ea580c' },
];

const srcMeta = (id: InteractionSource) => SOURCES.find((s) => s.id === id) || SOURCES[0];

const today = () => new Date().toISOString().slice(0, 10);

interface Draft {
  id?: number;
  request_source: InteractionSource;
  request_date: string;
  request_text: string;
  done: boolean;
  replies: InteractionReply[];
}

const emptyDraft = (): Draft => ({
  request_source: 'parent',
  request_date: today(),
  request_text: '',
  done: false,
  replies: [],
});

const field =
  'w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-300';

const SourcePicker = ({
  value,
  onChange,
}: {
  value: InteractionSource;
  onChange: (v: InteractionSource) => void;
}) => (
  <div className="flex gap-1">
    {SOURCES.map((s) => (
      <button
        key={s.id}
        type="button"
        onClick={() => onChange(s.id)}
        className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
          value === s.id ? 'text-white' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
        }`}
        style={value === s.id ? { backgroundColor: s.color } : undefined}
      >
        {s.label}
      </button>
    ))}
  </div>
);

const InteractionForm = ({
  initial,
  onSave,
  onCancel,
}: {
  initial: Draft;
  onSave: (d: Draft) => Promise<void>;
  onCancel: () => void;
}) => {
  const [d, setD] = useState<Draft>(initial);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  const addReply = () =>
    set('replies', [
      ...d.replies,
      { reply_source: 'parent', reply_date: today(), reply_text: '' },
    ]);

  const updateReply = (i: number, patch: Partial<InteractionReply>) =>
    set(
      'replies',
      d.replies.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );

  const removeReply = (i: number) =>
    set('replies', d.replies.filter((_, idx) => idx !== i));

  const submit = async () => {
    setSaving(true);
    try {
      await onSave(d);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-purple-50/60 border border-purple-100 rounded-lg p-2.5 space-y-2">
      {/* Запрос */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-gray-500">Запрос от</div>
        <div className="flex items-center gap-2 flex-wrap">
          <SourcePicker value={d.request_source} onChange={(v) => set('request_source', v)} />
          <input
            type="date"
            value={d.request_date}
            onChange={(e) => set('request_date', e.target.value)}
            className={`${field} w-32`}
          />
        </div>
        <textarea
          value={d.request_text}
          onChange={(e) => set('request_text', e.target.value)}
          placeholder="Текст запроса"
          rows={2}
          className={field}
        />
      </div>

      {/* Ответы */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-gray-500">Ответы</div>
        {d.replies.map((r, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded p-1.5 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <SourcePicker
                value={r.reply_source}
                onChange={(v) => updateReply(i, { reply_source: v })}
              />
              <input
                type="date"
                value={r.reply_date || ''}
                onChange={(e) => updateReply(i, { reply_date: e.target.value })}
                className={`${field} w-32`}
              />
              <button
                type="button"
                onClick={() => removeReply(i)}
                className="text-gray-400 hover:text-red-500 ml-auto"
                title="Удалить ответ"
              >
                <Icon name="Trash2" size={13} />
              </button>
            </div>
            <textarea
              value={r.reply_text}
              onChange={(e) => updateReply(i, { reply_text: e.target.value })}
              placeholder="Текст ответа"
              rows={2}
              className={field}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addReply}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:text-purple-700"
        >
          <Icon name="Plus" size={13} /> Добавить ответ
        </button>
      </div>

      {/* Сделано */}
      <label className="inline-flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={d.done}
          onChange={(e) => set('done', e.target.checked)}
          className="w-4 h-4 accent-green-600"
        />
        Сделано
      </label>

      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={saving} className="h-7 text-xs">
          {saving ? '…' : 'Сохранить'}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} className="h-7 text-xs">
          Отмена
        </Button>
      </div>
    </div>
  );
};

const InteractionView = ({
  it,
  onEdit,
  onDelete,
}: {
  it: StudentInteraction;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const rq = srcMeta(it.request_source);
  return (
    <div className="border-l-2 pl-2 py-1 group/it" style={{ borderColor: rq.color }}>
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold text-white"
            style={{ backgroundColor: rq.color }}
          >
            {rq.label}
          </span>
          {it.request_date && (
            <span className="text-[11px] text-gray-400 whitespace-nowrap">
              {fmtDate(it.request_date)}
            </span>
          )}
          {it.done && (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-green-600">
              <Icon name="Check" size={12} /> сделано
            </span>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover/it:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={onEdit} className="text-gray-400 hover:text-purple-600" title="Редактировать">
            <Icon name="Pencil" size={12} />
          </button>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-500" title="Удалить">
            <Icon name="Trash2" size={12} />
          </button>
        </div>
      </div>
      {it.request_text && (
        <div className="text-xs text-gray-700 mt-0.5">{it.request_text}</div>
      )}
      {it.replies.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {it.replies.map((r, i) => {
            const rs = srcMeta(r.reply_source);
            return (
              <div key={r.id ?? i} className="text-xs text-gray-600">
                <span className="font-semibold" style={{ color: rs.color }}>
                  {rs.label}
                </span>
                {r.reply_date && (
                  <span className="text-[11px] text-gray-400"> · {fmtDate(r.reply_date)}</span>
                )}
                {r.reply_text && <span>: {r.reply_text}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const InteractionsCell = ({
  studentId,
  initial,
  onChange,
}: {
  studentId: number;
  initial: StudentInteraction[];
  onChange?: (list: StudentInteraction[]) => void;
}) => {
  const [list, setList] = useState<StudentInteraction[]>(initial);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const push = (next: StudentInteraction[]) => {
    setList(next);
    onChange?.(next);
  };

  const handleSave = async (d: Draft) => {
    const { id, replies } = await saveInteraction(studentId, {
      id: d.id,
      request_source: d.request_source,
      request_date: d.request_date || null,
      request_text: d.request_text,
      done: d.done,
      replies: d.replies,
    });
    const saved: StudentInteraction = {
      id,
      request_source: d.request_source,
      request_date: d.request_date || null,
      request_text: d.request_text,
      done: d.done,
      replies,
    };
    const exists = list.some((x) => x.id === id);
    push(exists ? list.map((x) => (x.id === id ? saved : x)) : [saved, ...list]);
    setAdding(false);
    setEditId(null);
  };

  const handleDelete = async (id: number) => {
    await deleteInteraction(id);
    push(list.filter((x) => x.id !== id));
  };

  return (
    <td className="px-3 py-3 align-top" style={{ minWidth: 280, maxWidth: 380 }}>
      <div className="space-y-1.5">
        {list.map((it) =>
          editId === it.id ? (
            <InteractionForm
              key={it.id}
              initial={{
                id: it.id,
                request_source: it.request_source,
                request_date: it.request_date || today(),
                request_text: it.request_text,
                done: it.done,
                replies: it.replies.map((r) => ({ ...r })),
              }}
              onSave={handleSave}
              onCancel={() => setEditId(null)}
            />
          ) : (
            <InteractionView
              key={it.id}
              it={it}
              onEdit={() => { setAdding(false); setEditId(it.id); }}
              onDelete={() => handleDelete(it.id)}
            />
          ),
        )}

        {adding ? (
          <InteractionForm
            initial={emptyDraft()}
            onSave={handleSave}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button
            onClick={() => { setEditId(null); setAdding(true); }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700"
          >
            <Icon name="Plus" size={14} /> Взаимодействие
          </button>
        )}
      </div>
    </td>
  );
};

export default InteractionsCell;
