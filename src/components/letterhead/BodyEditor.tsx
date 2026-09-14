import { useRef } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

const BodyEditor = ({ value, onChange }: Props) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  const apply = (mode: 'bold' | 'h1' | 'h2') => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;

    if (mode === 'bold') {
      const sel = value.slice(start, end) || 'текст';
      const next = `${value.slice(0, start)}**${sel}**${value.slice(end)}`;
      onChange(next);
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(start + 2, start + 2 + sel.length);
      });
      return;
    }

    const mark = mode === 'h1' ? '# ' : '## ';
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const rest = value.slice(lineStart);
    const cleaned = rest.replace(/^#{1,2}\s*/, '');
    const already = rest.startsWith(mark);
    const next =
      value.slice(0, lineStart) + (already ? cleaned : mark + cleaned);
    onChange(next);
    requestAnimationFrame(() => ta.focus());
  };

  const btn =
    'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:border-green-400 hover:text-green-700 transition-colors';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-medium text-gray-600">Текст документа</label>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        <button onClick={() => apply('bold')} className={btn} title="Выделить жирным">
          <Icon name="Bold" size={13} />
          Жирный
        </button>
        <button onClick={() => apply('h1')} className={btn} title="Заголовок по центру">
          <Icon name="Heading1" size={13} />
          Заголовок
        </button>
        <button onClick={() => apply('h2')} className={btn} title="Подзаголовок по центру">
          <Icon name="Heading2" size={13} />
          Подзаголовок
        </button>
      </div>

      <textarea
        ref={ref}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 min-h-[300px] resize-y leading-relaxed font-mono"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={'# 1. ПРЕДМЕТ ДОГОВОРА\n1.1. Исполнитель обязуется **оказать услуги**…'}
      />
      <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
        Поставьте курсор на строку и нажмите «Заголовок» — она встанет по центру и станет жирной.
        Выделите слова и нажмите «Жирный».
      </p>
    </div>
  );
};

export default BodyEditor;
