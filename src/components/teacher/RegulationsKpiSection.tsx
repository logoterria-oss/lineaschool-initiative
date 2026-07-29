import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { LessonForm } from '@/lib/supervisionChecklist';
import RegulationsSection from './RegulationsSection';
import IndividualCriteriaTable from './IndividualCriteriaTable';
import GroupCriteriaTable from './GroupCriteriaTable';
import GroupKpiInfo from './GroupKpiInfo';
import GroupPenaltyInfo from './GroupPenaltyInfo';

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-6"
  >
    <Icon name="ArrowLeft" size={16} />
    <span className="text-sm">Назад</span>
  </button>
);

const TOP = [
  {
    id: 'regulations',
    label: 'Регламенты',
    icon: 'BookOpen' as const,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    border: 'border-purple-200 hover:border-purple-400',
  },
  {
    id: 'criteria',
    label: 'Критерии оценки и KPI',
    icon: 'ListChecks' as const,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    border: 'border-emerald-200 hover:border-emerald-400',
  },
];

const CRITERIA_TABS = [
  { id: 'criteria', label: 'Критерии оценки' },
  { id: 'kpi', label: 'KPI' },
  { id: 'penalty', label: 'Штрафные баллы' },
];

// Раздел «Регламенты и KPI» под конкретную форму работы педагога (individual / group).
const RegulationsKpiSection = ({ form }: { form: LessonForm }) => {
  const [block, setBlock] = useState<string | null>(null);
  const [tab, setTab] = useState('criteria');

  if (!block) {
    return (
      <div className="space-y-3">
        {TOP.map((b) => (
          <button
            key={b.id}
            onClick={() => setBlock(b.id)}
            className={`w-full flex items-center gap-4 bg-white rounded-xl border-2 ${b.border} p-5 text-left shadow-sm hover:shadow-md transition-all duration-200`}
          >
            <div className={`p-3 rounded-lg ${b.bg} flex-shrink-0`}>
              <Icon name={b.icon} size={24} className={b.color} />
            </div>
            <span className="font-semibold text-gray-900 text-lg">{b.label}</span>
            <Icon name="ChevronRight" size={18} className="text-gray-400 ml-auto flex-shrink-0" />
          </button>
        ))}
      </div>
    );
  }

  if (block === 'regulations') {
    return (
      <div>
        <BackButton onClick={() => setBlock(null)} />
        <RegulationsSection />
      </div>
    );
  }

  // block === 'criteria'
  return (
    <div>
      <BackButton onClick={() => { setBlock(null); setTab('criteria'); }} />

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
        form === 'group' ? <GroupCriteriaTable /> : <IndividualCriteriaTable />
      ) : tab === 'kpi' ? (
        form === 'group' ? (
          <GroupKpiInfo />
        ) : (
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
        )
      ) : form === 'group' ? (
        <GroupPenaltyInfo />
      ) : (
        <GroupPenaltyInfo
          exampleBaseScore={37}
          examplePenalty={3}
          exampleFinalScore={34}
          exampleBonus="+100 ₽/час"
          exampleHigherBonus="+200"
          exampleViolations={[
            '1 раз не вышли на занятие без предупреждения (без уважительной причины) → штраф –2;',
            '3 раза отправили ссылки после 10:00 → за это вам выставили –1 (половина от максимума).',
          ]}
        />
      )}
    </div>
  );
};

export default RegulationsKpiSection;
