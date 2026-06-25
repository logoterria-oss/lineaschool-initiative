import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { StudentOption } from '@/lib/useStudents';

interface Props {
  students: StudentOption[];
  loading?: boolean;
  value: number | '';
  /** Имя выбранного ученика (для отображения, в т.ч. при редактировании). */
  valueName?: string | null;
  onSelect: (student: StudentOption | null) => void;
}

const StudentCombobox = ({ students, loading, value, valueName, onSelect }: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selectedName = useMemo(() => {
    const found = students.find((s) => s.id === value);
    return found?.name ?? valueName ?? '';
  }, [students, value, valueName]);

  // Показываем выбранное имя, пока поле не в фокусе
  const display = open ? query : selectedName;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.name.toLowerCase().includes(q));
  }, [students, query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const pick = (s: StudentOption | null) => {
    onSelect(s);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <input
          className="w-full h-10 px-3 pr-8 rounded-md border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          placeholder={loading ? 'Загрузка…' : 'Начните вводить имя…'}
          value={display}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery('');
          }}
        />
        {selectedName && !open ? (
          <button
            type="button"
            onClick={() => pick(null)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
          >
            <Icon name="X" size={16} />
          </button>
        ) : (
          <Icon
            name="ChevronDown"
            size={16}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">Ничего не найдено</div>
          ) : (
            filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => pick(s)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 ${
                  s.id === value ? 'bg-emerald-50 font-medium' : ''
                }`}
              >
                {s.name}
                {s.age != null && <span className="text-gray-400"> ({s.age})</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default StudentCombobox;
