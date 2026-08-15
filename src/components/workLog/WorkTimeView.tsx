import { useState } from 'react';
import Icon from '@/components/ui/icon';
import WorkLogForm from './WorkLogForm';
import WorkLogList from './WorkLogList';
import WorkLogStatsView from './WorkLogStats';

/** Границы месяца по строке «2026-08» */
function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split('-').map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1));
  const to = new Date(Date.UTC(y, m, 0));
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

type Tab = 'stats' | 'list' | 'add';

interface Props {
  /** С какой вкладки открыть раздел */
  initialTab?: Tab;
}

/**
 * Личный учёт рабочего времени: сотрудник вносит задачи, смотрит свою
 * табличку за месяц и динамику своих показателей. Данные — только свои,
 * сводка по всем сотрудникам живёт в отдельном разделе для руководителя.
 */
const WorkTimeView = ({ initialTab = 'add' }: Props) => {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reloadKey, setReloadKey] = useState(0);

  const { from, to } = monthRange(month);
  const bump = () => setReloadKey((k) => k + 1);

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
          <TabButton id="add" icon="PlusCircle" label="Добавить" />
          <TabButton id="list" icon="ClipboardList" label="Таблица учёта" />
          <TabButton id="stats" icon="BarChart2" label="Моя статистика" />
        </div>
        {tab !== 'add' && (
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:border-amber-400"
          />
        )}
      </div>

      {tab === 'add' && (
        <WorkLogForm
          onSaved={() => {
            bump();
            setTab('list');
          }}
        />
      )}
      {tab === 'list' && (
        <WorkLogList dateFrom={from} dateTo={to} reloadKey={reloadKey} onChanged={bump} />
      )}
      {tab === 'stats' && <WorkLogStatsView dateFrom={from} dateTo={to} reloadKey={reloadKey} />}
    </div>
  );
};

export default WorkTimeView;