import Icon from '@/components/ui/icon';

interface Props {
  conclusion: string;
  selected: boolean;
  hint?: string;
}

export default function InterimPrimaryConclusionSection({ conclusion, selected, hint }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Заключение первичной диагностики</h2>
      <p className="text-sm text-gray-500 mb-4">Подтягивается автоматически при выборе ученика.</p>

      {selected && hint && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <Icon name="TrendingUp" size={18} className="mt-0.5 flex-shrink-0 text-green-600" />
          <span>{hint}</span>
        </div>
      )}

      {!selected && (
        <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
          Выберите ученика в разделе «Персональные данные».
        </div>
      )}

      {selected && !conclusion && (
        <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
          В первичной диагностике заключение не заполнено.
        </div>
      )}

      {selected && conclusion && (
        <div className="rounded-md bg-gray-50 p-4 text-sm leading-6 text-gray-800 whitespace-pre-wrap">
          {conclusion}
        </div>
      )}
    </div>
  );
}