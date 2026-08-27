import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  num: number | null;
  title: string;
  place: string;
  done: boolean;
  comment: string;
  /** Задача от руководителя — выделяем, чтобы не потерялась */
  fromHead?: boolean;
  readOnly?: boolean;
  onChange: (p: { done: boolean; comment: string }) => void;
}

/** Строка чек-листа: галочка «выполнено» и комментарий */
const ChecklistRow = ({
  num,
  title,
  place,
  done,
  comment,
  fromHead,
  readOnly,
  onChange,
}: Props) => {
  const [text, setText] = useState(comment);
  const [open, setOpen] = useState(!!comment);

  useEffect(() => setText(comment), [comment]);

  const saveComment = () => {
    if (text !== comment) onChange({ done, comment: text });
  };

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 transition-colors ${
        done ? 'border-green-200 bg-green-50/60' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <button
          disabled={readOnly}
          onClick={() => onChange({ done: !done, comment: text })}
          className={`mt-0.5 shrink-0 ${
            done ? 'text-green-600' : 'text-gray-300 hover:text-gray-400'
          } ${readOnly ? 'cursor-default' : ''}`}
          title={done ? 'Снять отметку' : 'Отметить выполненной'}
        >
          <Icon name={done ? 'CircleCheck' : 'Circle'} size={20} />
        </button>

        <div className="min-w-0 flex-1">
          <div className={`text-sm leading-snug ${done ? 'text-gray-500' : 'text-gray-900'}`}>
            {num !== null && <span className="text-gray-400 mr-1.5">{num}.</span>}
            {title}
            {fromHead && (
              <span className="ml-2 text-[10px] font-medium bg-amber-100 text-amber-700 rounded px-1.5 py-0.5 align-middle">
                от руководителя
              </span>
            )}
          </div>
          {place && <div className="text-[11px] text-gray-400 mt-0.5">{place}</div>}

          {open ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={saveComment}
              readOnly={readOnly}
              rows={2}
              placeholder="Комментарий: что сделано, что помешало"
              className="mt-2 w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs resize-y"
            />
          ) : (
            !readOnly && (
              <button
                onClick={() => setOpen(true)}
                className="mt-1.5 text-[11px] text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <Icon name="MessageSquarePlus" size={12} />
                Добавить комментарий
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ChecklistRow;
