import type { FinModelState, Tab } from './useFinModel';

interface Props {
  fm: FinModelState;
}

const FinModelTabsNav = ({ fm }: Props) => {
  const { tab, setTab, notifTabs } = fm;

  return (
    <div className="flex flex-wrap gap-x-1 border-b border-gray-200 print:hidden">
      {([['dashboard', 'Дашборд'], ['avans', 'Авансовые доходы'], ['fact', 'Фактические доходы'], ['revenue', 'Поступления и переменные'], ['students', 'Ученики и занятия'], ['fixed', 'Постоянные расходы'], ['one_time', 'Разовые расходы'], ['credit', 'Кредит'], ['ano', 'АНО'], ['taxes', 'Налоги'], ['payouts', 'Выплата собственнику'], ['pnl', 'P&L'], ['cashflow', 'Cash Flow'], ['bank', 'Банк'], ['scenarios', 'Сценарии'], ['adaptation', 'Адаптация']] as [Tab, string][]).map(([t, label]) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          className={`px-4 py-2 text-sm -mb-px border-b-2 transition-colors ${
            tab === t ? 'border-gray-900 text-gray-900 font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          {label}
          {notifTabs.has(t) && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-rose-500 align-middle" />}
        </button>
      ))}
    </div>
  );
};

export default FinModelTabsNav;
