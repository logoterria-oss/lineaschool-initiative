import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  DictationSet,
  findDictation,
  matchByWords,
  optionValue,
} from './dictationCatalog';

interface Props {
  /** Наборы диктантов: один (первичная) или несколько (промежуточная) */
  sets: DictationSet[];
  /** Текущее количество слов */
  words: string;
  onWordsChange: (words: string) => void;
  /** Класс ученика — этот диктант подсветим как подходящий */
  grade?: string;
  /** Не показывать поле для ручного ввода числа (когда оно уже есть рядом) */
  hideWordsInput?: boolean;
  className?: string;
}

/**
 * Выбор диктанта из списка с автоподстановкой количества слов.
 * Нужного диктанта нет — можно вписать число слов вручную.
 */
export default function DictationPicker({
  sets,
  words,
  onWordsChange,
  grade,
  hideWordsInput,
  className,
}: Props) {
  // Выбранный диктант помним отдельно: у разных диктантов бывает
  // одинаковое число слов, поэтому по числу его не определить однозначно.
  const [picked, setPicked] = useState('');

  // Значение пришло со стороны (загрузили заключение, вписали вручную) —
  // подставляем подходящий диктант, если он однозначно узнаётся.
  useEffect(() => {
    const found = picked ? findDictation(picked) : null;
    if (found && String(found.words) === (words || '').trim()) return;
    setPicked(matchByWords(words, sets));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

  const gradeNum = Number(grade);
  const selected = picked;

  const handleSelect = (value: string) => {
    setPicked(value);
    if (!value) {
      onWordsChange('');
      return;
    }
    const found = findDictation(value);
    if (found) onWordsChange(String(found.words));
  };

  return (
    <div className={className}>
      <select
        value={selected}
        onChange={(e) => handleSelect(e.target.value)}
        className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Выберите диктант или впишите слова вручную</option>
        {sets.map((set) => (
          <optgroup key={set.num} label={set.label}>
            {set.items.map((item) => (
              <option key={optionValue(set.num, item.grade)} value={optionValue(set.num, item.grade)}>
                {item.grade} класс — «{item.title}» ({item.words} слов)
                {gradeNum === item.grade ? ' • по классу ученика' : ''}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {!hideWordsInput && (
        <div className="mt-2 flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min="0"
            value={words}
            onChange={(e) => onWordsChange(e.target.value)}
            className="w-32"
            placeholder="0"
          />
          <span className="text-sm text-gray-500">слов</span>
        </div>
      )}

      {selected && (
        <p className="mt-1 text-xs text-gray-600">
          Выбран диктант «{findDictation(selected)?.title}» — {words} слов
        </p>
      )}
      {words && !selected && (
        <p className="mt-1 text-xs text-gray-500">Свой диктант — количество слов введено вручную</p>
      )}
    </div>
  );
}