import { useState } from 'react';
import Icon from '@/components/ui/icon';
import IndividualRegulation from '@/components/teacher/regulations/IndividualRegulation';
import GroupRegulation from '@/components/teacher/regulations/GroupRegulation';
import IndividualCriteriaTable from '@/components/teacher/IndividualCriteriaTable';
import GroupCriteriaTable from '@/components/teacher/GroupCriteriaTable';
import GroupKpiInfo from '@/components/teacher/GroupKpiInfo';

type IconName = 'Users' | 'User' | 'ShieldCheck';

interface Block {
  id: 'individual' | 'group' | 'admin';
  label: string;
  icon: IconName;
  color: string;
  bg: string;
  border: string;
}

const TOP_BLOCKS: Block[] = [
  {
    id: 'individual',
    label: 'Регламент педагогов — индивидуальные занятия',
    icon: 'User',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    border: 'border-blue-200 hover:border-blue-400',
  },
  {
    id: 'group',
    label: 'Регламент педагогов — групповые занятия',
    icon: 'Users',
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    border: 'border-purple-200 hover:border-purple-400',
  },
  {
    id: 'admin',
    label: 'Регламент администратора',
    icon: 'ShieldCheck',
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    border: 'border-amber-200 hover:border-amber-400',
  },
];

const TABS = [
  { id: 'regulation', label: 'Регламент' },
  { id: 'criteria', label: 'Критерии оценки' },
  { id: 'kpi', label: 'KPI' },
];

const INDIVIDUAL_KPI_PROPS = {
  bonusRows: [
    { score: 'от 30 до 34', bonus: '+ 100 ₽', total: '400 ₽' },
    { score: 'от 35 до 40', bonus: '+ 200 ₽', total: '500 ₽' },
    { score: 'от 41 до 45', bonus: '+ 350 ₽', total: '650 ₽' },
  ],
  exampleScore: 37,
  exampleBonus: '200 ₽',
  exampleTotal: '500 ₽',
};

const MenuButton = ({ item, onClick }: { item: Block; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 bg-white rounded-xl border-2 ${item.border} p-5 text-left shadow-sm hover:shadow-md transition-all duration-200`}
  >
    <div className={`p-3 rounded-lg ${item.bg} flex-shrink-0`}>
      <Icon name={item.icon} size={24} className={item.color} />
    </div>
    <span className="font-semibold text-gray-900 text-lg">{item.label}</span>
    <Icon name="ChevronRight" size={18} className="text-gray-400 ml-auto flex-shrink-0" />
  </button>
);

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-6"
  >
    <Icon name="ArrowLeft" size={16} />
    <span className="text-sm">Назад</span>
  </button>
);

const RegulationsView = () => {
  const [block, setBlock] = useState<'individual' | 'group' | 'admin' | null>(null);
  const [tab, setTab] = useState('regulation');

  const openBlock = (id: 'individual' | 'group' | 'admin') => {
    setBlock(id);
    setTab('regulation');
  };
  const reset = () => {
    setBlock(null);
    setTab('regulation');
  };

  // Уровень 1: меню
  if (!block) {
    return (
      <div className="space-y-3">
        {TOP_BLOCKS.map((b) => (
          <MenuButton key={b.id} item={b} onClick={() => openBlock(b.id)} />
        ))}
      </div>
    );
  }

  // Регламент администратора — заглушка
  if (block === 'admin') {
    return (
      <div>
        <BackButton onClick={reset} />
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          <div className="inline-flex p-4 rounded-full bg-amber-100 mb-4">
            <Icon name="ShieldCheck" size={32} className="text-amber-600" />
          </div>
          <p className="text-lg font-medium text-gray-500">
            Раздел «Регламент администратора» в разработке
          </p>
        </div>
      </div>
    );
  }

  const isIndividual = block === 'individual';

  return (
    <div>
      <BackButton onClick={reset} />

      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'regulation' ? (
        isIndividual ? (
          <IndividualRegulation onBack={reset} hideHeader />
        ) : (
          <GroupRegulation onBack={reset} hideHeader />
        )
      ) : tab === 'criteria' ? (
        isIndividual ? <IndividualCriteriaTable /> : <GroupCriteriaTable />
      ) : isIndividual ? (
        <GroupKpiInfo {...INDIVIDUAL_KPI_PROPS} />
      ) : (
        <GroupKpiInfo />
      )}
    </div>
  );
};

export default RegulationsView;
