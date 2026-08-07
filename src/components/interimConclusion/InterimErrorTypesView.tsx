import { DysgraphicErrorItem } from '@/components/interimDiag/readingWriting';

type ErrorItemInput = DysgraphicErrorItem | string;

interface Props {
  readingErrorTypes: ErrorItemInput[];
  errorTypes: ErrorItemInput[];
  orthoErrorTypes: ErrorItemInput[];
}

// Часть записей (внесённые вручную прошлые диагностики) хранит ошибки
// простым списком названий — приводим оба формата к одному виду
function normalize(items: ErrorItemInput[]): DysgraphicErrorItem[] {
  return (items || [])
    .map((it) =>
      typeof it === 'string' ? { label: it, struck: false, added: false } : it,
    )
    .filter((it) => it && it.label);
}

function Block({ title, items }: { title: string; items: ErrorItemInput[] }) {
  const list = normalize(items);
  if (list.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 text-base font-semibold text-gray-800">{title}</h3>
      <ul className="space-y-1 text-sm">
        {list.map((it, idx) => (
          <li
            key={`${it.label}-${idx}`}
            className={
              it.struck
                ? 'text-gray-400 line-through'
                : it.added
                  ? 'text-red-600'
                  : 'text-gray-700'
            }
          >
            {it.added ? '+ ' : ''}
            {it.label}
            {it.struck ? ' — преодолено' : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function InterimErrorTypesView({
  readingErrorTypes,
  errorTypes,
  orthoErrorTypes,
}: Props) {
  const empty =
    normalize(readingErrorTypes).length === 0 &&
    normalize(errorTypes).length === 0 &&
    normalize(orthoErrorTypes).length === 0;
  if (empty) return null;

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-gray-900">Типы ошибок</h2>
      <p className="mb-3 text-xs text-gray-500">
        Зачёркнутые — преодолённые ошибки, красные со знаком «плюс» — появившиеся впервые.
      </p>
      <div className="space-y-4">
        <Block title="Ошибки чтения" items={readingErrorTypes} />
        <Block title="Дисграфические ошибки" items={errorTypes} />
        <Block title="Орфографические ошибки" items={orthoErrorTypes} />
      </div>
    </section>
  );
}