import { useState } from 'react';
import Icon from '@/components/ui/icon';
import IndividualRegulation from './regulations/IndividualRegulation';

const RegulationsSection = () => {
  const [open, setOpen] = useState<string | null>(null);

  if (open === 'individual') {
    return (
      <div>
        <button
          onClick={() => setOpen(null)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
        >
          <Icon name="ArrowLeft" size={16} />
          Назад к регламентам
        </button>
        <IndividualRegulation />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen('individual')}
        className="w-full flex items-center gap-4 bg-white rounded-xl border-2 border-blue-200 hover:border-blue-400 p-5 text-left shadow-sm hover:shadow-md transition-all duration-200"
      >
        <div className="p-3 rounded-lg bg-blue-100 flex-shrink-0">
          <Icon name="User" size={24} className="text-blue-600" />
        </div>
        <span className="font-semibold text-gray-900 text-lg">Индивидуальные занятия</span>
        <Icon name="ChevronRight" size={18} className="text-gray-400 ml-auto flex-shrink-0" />
      </button>

      <button
        disabled
        className="w-full flex items-center gap-4 bg-gray-50 rounded-xl border-2 border-gray-200 p-5 text-left opacity-60 cursor-not-allowed"
      >
        <div className="p-3 rounded-lg bg-purple-100 flex-shrink-0">
          <Icon name="Users" size={24} className="text-purple-600" />
        </div>
        <span className="font-semibold text-gray-500 text-lg">Групповые занятия</span>
        <span className="text-xs text-gray-400 ml-auto flex-shrink-0">скоро</span>
      </button>
    </div>
  );
};

export default RegulationsSection;
