import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface Props {
  /** Текст, собранный автоматически из данных выше */
  autoText: string;
  /** Правка логопеда; пустая строка — используется автотекст */
  value: string;
  edited: boolean;
  onChange: (v: string) => void;
  onReset: () => void;
}

/**
 * Общий вывод о динамике: предпросмотр автотекста с возможностью правки.
 * Пока логопед не трогал поле, текст пересобирается сам при изменении данных.
 */
export default function InterimSummarySection({
  autoText,
  value,
  edited,
  onChange,
  onReset,
}: Props) {
  const text = edited ? value : autoText;

  return (
    <section className="rounded-lg bg-gray-50 p-6">
      <h2 className="text-xl font-bold text-gray-900">Общий вывод о динамике</h2>
      <p className="mt-1 text-sm text-gray-500">
        Составляется автоматически по данным выше. Текст попадёт в конец заключения — его можно
        отредактировать.
      </p>

      {!autoText && !edited ? (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-gray-200 bg-white p-3">
          <Icon name="Info" size={16} className="mt-0.5 shrink-0 text-gray-400" />
          <p className="text-sm text-gray-600">
            Заполните уровни процессов и показатели чтения и письма — вывод появится
            автоматически.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between gap-3">
            <Label htmlFor="interim-summary" className="text-sm text-gray-700">
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
            id="interim-summary"
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
