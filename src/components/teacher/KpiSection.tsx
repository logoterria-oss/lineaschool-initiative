import { useState } from 'react';
import Icon from '@/components/ui/icon';
import IndividualCriteriaTable from './IndividualCriteriaTable';
import GroupCriteriaTable from './GroupCriteriaTable';
import RegulationsSection from './RegulationsSection';
import GroupKpiInfo from './GroupKpiInfo';
import GroupPenaltyInfo from './GroupPenaltyInfo';

type IconName = 'Users' | 'User' | 'UserCheck' | 'ListChecks' | 'BarChart2' | 'BookOpen';

interface KpiCategory {
  id: string;
  label: string;
  icon: IconName;
  color: string;
  bg: string;
  border: string;
}

const TOP_BLOCKS: KpiCategory[] = [
  {
    id: 'supervisions',
    label: 'Мои супервизии',
    icon: 'UserCheck',
    color: 'text-indigo-600',
    bg: 'bg-indigo-100',
    border: 'border-indigo-200 hover:border-indigo-400',
  },
  {
    id: 'regulations',
    label: 'Регламенты',
    icon: 'BookOpen',
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    border: 'border-purple-200 hover:border-purple-400',
  },
  {
    id: 'criteria',
    label: 'Критерии оценки и KPI',
    icon: 'ListChecks',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    border: 'border-emerald-200 hover:border-emerald-400',
  },
];

const KPI_SUBSECTIONS: KpiCategory[] = [
  {
    id: 'group',
    label: 'Групповые',
    icon: 'Users',
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    border: 'border-orange-200 hover:border-orange-400',
  },
  {
    id: 'individual',
    label: 'Индивидуальные',
    icon: 'User',
    color: 'text-teal-600',
    bg: 'bg-teal-100',
    border: 'border-teal-200 hover:border-teal-400',
  },
];

const GROUP_TEACHERS = [
  { id: 20, name: 'Канкулова Екатерина' },
  { id: 15, name: 'Мацвей Екатерина' },
];

const INDIVIDUAL_TEACHERS = [
  { id: 4, name: 'Еремина Дарья' },
  { id: 18, name: 'Карамова Анна' },
  { id: 11, name: 'Камнева Валерия' },
  { id: 2, name: 'Шишаева Анастасия' },
];

const MenuButton = ({ item, onClick }: { item: KpiCategory; onClick: () => void }) => (
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

const Placeholder = ({ item }: { item: KpiCategory }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
    <div className={`inline-flex p-4 rounded-full ${item.bg} mb-4`}>
      <Icon name={item.icon} size={32} className={item.color} />
    </div>
    <p className="text-lg font-medium text-gray-500">Раздел «{item.label}» в разработке</p>
  </div>
);

const CRITERIA_TABS = [
  { id: 'criteria', label: 'Критерии оценки' },
  { id: 'kpi', label: 'KPI' },
  { id: 'penalty', label: 'Штрафные баллы' },
];

const KpiSection = () => {
  const [block, setBlock] = useState<string | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const [tab, setTab] = useState('criteria');

  // Уровень 1: выбор Супервизии / Регламенты / Критерии
  if (!block) {
    return (
      <div className="space-y-3">
        {TOP_BLOCKS.map((b) => (
          <MenuButton key={b.id} item={b} onClick={() => setBlock(b.id)} />
        ))}
      </div>
    );
  }

  // Регламенты — без деления на Групповые / Индивидуальные
  if (block === 'regulations') {
    return (
      <div>
        <BackButton onClick={() => setBlock(null)} />
        <RegulationsSection />
      </div>
    );
  }

  // Супервизии — все педагоги списком, как в «Контроль ДЗ»
  if (block === 'supervisions') {
    return (
      <div>
        <BackButton onClick={() => setBlock(null)} />
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Индивидуальные занятия
            </h3>
            <div className="grid gap-2">
              {INDIVIDUAL_TEACHERS.map((t) => (
                <div
                  key={t.id}
                  className="w-full flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <Icon name="User" size={18} className="text-teal-600" />
                  </div>
                  <span className="font-medium text-gray-900">{t.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Групповые занятия
            </h3>
            <div className="grid gap-2">
              {GROUP_TEACHERS.map((t) => (
                <div
                  key={t.id}
                  className="w-full flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Icon name="Users" size={18} className="text-orange-600" />
                  </div>
                  <span className="font-medium text-gray-900">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Уровень 2: выбор Групповые / Индивидуальные
  if (!section) {
    return (
      <div>
        <BackButton onClick={() => setBlock(null)} />
        <div className="space-y-3">
          {KPI_SUBSECTIONS.map((sub) => (
            <MenuButton key={sub.id} item={sub} onClick={() => setSection(sub.id)} />
          ))}
        </div>
      </div>
    );
  }

  const activeBlock = TOP_BLOCKS.find((b) => b.id === block)!;

  // Уровень 3
  return (
    <div>
      <BackButton onClick={() => { setSection(null); setTab('criteria'); }} />

      {block === 'criteria' ? (
        <>
          {/* Навигация: Критерии оценки / KPI / Штрафные баллы */}
          <div className="flex flex-wrap gap-2 mb-5">
            {CRITERIA_TABS.map((t) => (
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

          {tab === 'criteria' ? (
            section === 'group' ? <GroupCriteriaTable /> : <IndividualCriteriaTable />
          ) : tab === 'kpi' && section === 'group' ? (
            <GroupKpiInfo />
          ) : tab === 'kpi' && section === 'individual' ? (
            <GroupKpiInfo
              bonusRows={[
                { score: 'от 30 до 34', bonus: '+ 100 ₽', total: '400 ₽' },
                { score: 'от 35 до 40', bonus: '+ 200 ₽', total: '500 ₽' },
                { score: 'от 41 до 45', bonus: '+ 350 ₽', total: '650 ₽' },
              ]}
              exampleScore={37}
              exampleBonus="200 ₽"
              exampleTotal="500 ₽"
            />
          ) : tab === 'penalty' && section === 'group' ? (
            <GroupPenaltyInfo />
          ) : tab === 'penalty' && section === 'individual' ? (
            <GroupPenaltyInfo
              exampleBaseScore={37}
              examplePenalty={3}
              exampleFinalScore={34}
              exampleBonus="+100 ₽/час"
              exampleHigherBonus="+200"
            />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="inline-flex p-4 rounded-full bg-emerald-100 mb-4">
                <Icon name={tab === 'kpi' ? 'BarChart2' : 'AlertTriangle'} size={32} className="text-emerald-600" />
              </div>
              <p className="text-lg font-medium text-gray-500">
                Раздел «{CRITERIA_TABS.find((t) => t.id === tab)?.label}» в разработке
              </p>
            </div>
          )}
        </>
      ) : (
        <Placeholder item={activeBlock} />
      )}
    </div>
  );
};

export default KpiSection;