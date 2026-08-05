import { DysgraphicErrorItem } from '@/components/interimDiag/readingWriting';

interface Props {
  readingErrorTypes: DysgraphicErrorItem[];
  errorTypes: DysgraphicErrorItem[];
  orthoErrorTypes: DysgraphicErrorItem[];
}

function Block({ title, items }: { title: string; items: DysgraphicErrorItem[] }) {
  const list = items || [];
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
    (readingErrorTypes || []).length === 0 &&
    (errorTypes || []).length === 0 &&
    (orthoErrorTypes || []).length === 0;
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
