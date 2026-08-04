interface Props {
  conclusion: string;
  selected: boolean;
}

export default function InterimPrimaryConclusionSection({ conclusion, selected }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Заключение первичной диагностики</h2>
      <p className="text-sm text-gray-500 mb-4">Подтягивается автоматически при выборе ученика.</p>

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
