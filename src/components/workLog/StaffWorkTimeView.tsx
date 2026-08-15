import { useState } from 'react';
import Icon from '@/components/ui/icon';
import WorkLogList from './WorkLogList';
import WorkLogStatsView from './WorkLogStats';

/** Границы месяца по строке «2026-08» */
function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split('-').map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1));
  const to = new Date(Date.UTC(y, m, 0));
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

type Tab = 'stats' | 'list';

/**
 * Учёт рабочего времени сотрудников: сводка по всем, кто ведёт учёт
 * (администраторы и руководители). Раздел только для руководителя —
 * личные записи каждый ведёт у себя в «Учёте рабочего времени».
 */
const StaffWorkTimeView = () => {
  const [tab, setTab] = useState<Tab>('stats');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const { from, to } = monthRange(month);

  const TabButton = ({ id, icon, label }: { id: Tab; icon: string; label: string }) => (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        tab === id
          ? 'border-amber-500 text-gray-900'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      <Icon name={icon as 'BarChart2'} size={15} />
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex border-b border-gray-200 flex-1 min-w-[260px]">
          <TabButton id="stats" icon="BarChart2" label="Сводка по сотрудникам" />
          <TabButton id="list" icon="ClipboardList" label="Все записи" />
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:border-amber-400"
        />
      </div>

      {tab === 'stats' && <WorkLogStatsView dateFrom={from} dateTo={to} allStaff />}
      {tab === 'list' && <WorkLogList dateFrom={from} dateTo={to} allStaff />}
    </div>
  );
};

export default StaffWorkTimeView;
