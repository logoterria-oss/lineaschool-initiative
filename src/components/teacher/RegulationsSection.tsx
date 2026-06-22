import { useState } from 'react';
import Icon from '@/components/ui/icon';
import IndividualRegulation from '@/components/teacher/regulations/IndividualRegulation';
import GroupRegulation from '@/components/teacher/regulations/GroupRegulation';

type RegType = 'individual' | 'group' | null;

const RegulationsSection = () => {
  const [active, setActive] = useState<RegType>(null);

  if (active === 'individual') {
    return <IndividualRegulation onBack={() => setActive(null)} />;
  }
  if (active === 'group') {
    return <GroupRegulation onBack={() => setActive(null)} />;
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setActive('individual')}
        className="w-full flex items-center gap-4 bg-white rounded-xl border-2 border-blue-200 hover:border-blue-400 p-5 text-left shadow-sm hover:shadow-md transition-all duration-200"
      >
        <div className="p-3 rounded-lg bg-blue-100 flex-shrink-0">
          <Icon name="User" size={24} className="text-blue-600" />
        </div>
        <span className="font-semibold text-gray-900 text-lg">Индивидуальные занятия</span>
        <Icon name="ChevronRight" size={18} className="text-gray-400 ml-auto flex-shrink-0" />
      </button>

      <button
        onClick={() => setActive('group')}
        className="w-full flex items-center gap-4 bg-white rounded-xl border-2 border-purple-200 hover:border-purple-400 p-5 text-left shadow-sm hover:shadow-md transition-all duration-200"
      >
        <div className="p-3 rounded-lg bg-purple-100 flex-shrink-0">
          <Icon name="Users" size={24} className="text-purple-600" />
        </div>
        <span className="font-semibold text-gray-900 text-lg">Групповые занятия</span>
        <Icon name="ChevronRight" size={18} className="text-gray-400 ml-auto flex-shrink-0" />
      </button>
    </div>
  );
};

export default RegulationsSection;
