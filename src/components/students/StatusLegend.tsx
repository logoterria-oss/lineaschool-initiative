const LEGEND: { color: string; label: string }[] = [
  { color: 'bg-green-500', label: 'Активен' },
  { color: 'bg-amber-400', label: 'Каникулы' },
  { color: 'bg-sky-400', label: 'Абонемент заморожен' },
  { color: 'bg-red-500', label: 'Бросил / Завершил' },
  { color: 'bg-gray-300', label: 'Статус не указан' },
];

const StatusLegend = () => (
  <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 mb-4">
    <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
      Обозначение цвета статуса
    </div>
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {LEGEND.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-2 text-sm text-gray-700">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${it.color}`} />
          {it.label}
        </span>
      ))}
    </div>
  </div>
);

export default StatusLegend;
