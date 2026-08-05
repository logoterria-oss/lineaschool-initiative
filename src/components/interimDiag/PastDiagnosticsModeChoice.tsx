import Icon from '@/components/ui/icon';

interface Props {
  loading: boolean;
  itemsCount: number;
  onEdit: () => void;
  onAdd: () => void;
}

export default function PastDiagnosticsModeChoice({
  loading,
  itemsCount,
  onEdit,
  onAdd,
}: Props) {
  return (
    <div className="p-5">
      <p className="mb-4 text-sm text-gray-700">Что нужно сделать?</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onEdit}
          disabled={loading || itemsCount === 0}
          className="rounded-lg border border-gray-300 p-4 text-left hover:border-primary hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-300 disabled:hover:bg-white"
        >
          <span className="flex items-center gap-2 font-medium text-gray-900">
            <Icon name="Pencil" size={16} className="text-gray-500" />
            Изменить данные прошлых диагностик
          </span>
          <span className="mt-1 block text-sm text-gray-500">
            {loading
              ? 'Загрузка…'
              : itemsCount === 0
                ? 'Сохранённых диагностик пока нет'
                : `Первичная и промежуточные, уже сохранённые в системе (${itemsCount})`}
          </span>
        </button>

        <button
          type="button"
          onClick={onAdd}
          className="rounded-lg border border-gray-300 p-4 text-left hover:border-primary hover:bg-gray-50"
        >
          <span className="flex items-center gap-2 font-medium text-gray-900">
            <Icon name="Plus" size={16} className="text-gray-500" />
            Внести данные по прошлым диагностикам
          </span>
          <span className="mt-1 block text-sm text-gray-500">
            Первичная или промежуточная проводилась не в этой форме
          </span>
        </button>
      </div>
    </div>
  );
}
