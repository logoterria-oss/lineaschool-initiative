import { useState } from 'react';
import Icon from '@/components/ui/icon';

const KPI_SUBSECTIONS = [
  {
    id: 'group',
    label: 'Групповые',
    icon: 'Users' as const,
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    border: 'border-orange-200 hover:border-orange-400',
  },
  {
    id: 'individual',
    label: 'Индивидуальные',
    icon: 'User' as const,
    color: 'text-teal-600',
    bg: 'bg-teal-100',
    border: 'border-teal-200 hover:border-teal-400',
  },
];

const KpiSection = () => {
  const [activeSubsection, setActiveSubsection] = useState<string | null>(null);

  if (activeSubsection) {
    const sub = KPI_SUBSECTIONS.find((s) => s.id === activeSubsection)!;
    return (
      <div>
        <button
          onClick={() => setActiveSubsection(null)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-6"
        >
          <Icon name="ArrowLeft" size={16} />
          <span className="text-sm">Назад</span>
        </button>
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          <div className={`inline-flex p-4 rounded-full ${sub.bg} mb-4`}>
            <Icon name={sub.icon} size={32} className={sub.color} />
          </div>
          <p className="text-lg font-medium text-gray-500">Раздел «{sub.label}» в разработке</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {KPI_SUBSECTIONS.map((sub) => (
        <button
          key={sub.id}
          onClick={() => setActiveSubsection(sub.id)}
          className={`w-full flex items-center gap-4 bg-white rounded-xl border-2 ${sub.border} p-5 text-left shadow-sm hover:shadow-md transition-all duration-200`}
        >
          <div className={`p-3 rounded-lg ${sub.bg} flex-shrink-0`}>
            <Icon name={sub.icon} size={24} className={sub.color} />
          </div>
          <span className="font-semibold text-gray-900 text-lg">{sub.label}</span>
          <Icon name="ChevronRight" size={18} className="text-gray-400 ml-auto flex-shrink-0" />
        </button>
      ))}
    </div>
  );
};

export default KpiSection;
