import Icon from '@/components/ui/icon';

interface Props {
  active: boolean;
  loading: boolean;
}

/** Пояснение, что форма открыта для правки уже сохранённого заключения */
export default function EditModeBanner({ active, loading }: Props) {
  if (!active) return null;

  return (
    <div className="mb-6 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
      <Icon
        name={loading ? 'LoaderCircle' : 'Pencil'}
        size={16}
        className={`mt-0.5 shrink-0 text-blue-600 ${loading ? 'animate-spin' : ''}`}
      />
      <p className="text-sm text-blue-900">
        {loading ? (
          'Загружаем сохранённое заключение…'
        ) : (
          <>
            <span className="font-semibold">Режим изменения. </span>
            Правки перезапишут существующее заключение, ссылка на него не изменится.
          </>
        )}
      </p>
    </div>
  );
}
