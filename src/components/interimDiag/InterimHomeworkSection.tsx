import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface Props {
  /** Текст, собранный автоматически из отметок в разделе «Контроль ДЗ» */
  autoText: string;
  /** Правка логопеда; пустая строка — используется автотекст */
  value: string;
  edited: boolean;
  /** Идёт загрузка отметок по выбранному ученику */
  loading: boolean;
  /** Ученик выбран из списка (иначе данные подтянуть неоткуда) */
  selected: boolean;
  onChange: (v: string) => void;
  onReset: () => void;
}

/**
 * Выполнение ДЗ: отчёт собирается по отметкам педагогов из «Контроля ДЗ».
 * Учитываются только проставленные цвета — занятия без отметки в статистику
 * не идут, поскольку пустая клетка означает незаполненный контроль,
 * а не невыполненное задание.
 */
export default function InterimHomeworkSection({
  autoText,
  value,
  edited,
  loading,
  selected,
  onChange,
  onReset,
}: Props) {
  const text = edited ? value : autoText;

  const hint = () => {
    if (loading) return 'Загружаем отметки из раздела «Контроль ДЗ»…';
    if (!selected) return 'Выберите ученика из списка — отчёт соберётся автоматически.';
    return 'По этому ученику в разделе «Контроль ДЗ» пока нет ни одной отметки. Отчёт появится, когда педагоги начнут отмечать выполнение заданий.';
  };

  return (
    <section className="rounded-lg bg-gray-50 p-6">
      <h2 className="text-xl font-bold text-gray-900">Выполнение ДЗ</h2>
      <p className="mt-1 text-sm text-gray-500">
        Составляется автоматически по отметкам педагогов в разделе «Контроль ДЗ». Занятия без
        отметки в статистику не входят. Текст попадёт в заключение — его можно отредактировать.
      </p>

      {!autoText && !edited ? (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-gray-200 bg-white p-3">
          <Icon
            name={loading ? 'Loader' : 'Info'}
            size={16}
            className={`mt-0.5 shrink-0 text-gray-400 ${loading ? 'animate-spin' : ''}`}
          />
          <p className="text-sm text-gray-600">{hint()}</p>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between gap-3">
            <Label htmlFor="interim-homework" className="text-sm text-gray-700">
              {edited ? 'Отредактировано вручную' : 'Предпросмотр'}
            </Label>
            {edited && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
              >
                <Icon name="RotateCcw" size={13} />
                Вернуть автоматический текст
              </button>
            )}
          </div>

          <Textarea
            id="interim-homework"
            value={text}
            onChange={(e) => onChange(e.target.value)}
            rows={7}
            className="mt-2 bg-white"
          />
        </>
      )}
    </section>
  );
}
