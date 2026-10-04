import Icon from '@/components/ui/icon';
import { CreditOption, SCENARIOS, SCENARIO_LABEL, TaxRegimeGlobal, fmMoney, fmMonthLabel } from '@/lib/finmodelApi';
import type { FinModelState } from './useFinModel';

interface Props {
  fm: FinModelState;
}

const FinModelHeader = ({ fm }: Props) => {
  const { dash, annual, annualFact, unread, active, busyTop, credit, monthOpen, setTab,
    onScenarioTop, onTaxGlobal, onCreditTop, onCloseMonth, onRecalc, onExport } = fm;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3 print:hidden">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div>
          <span className="text-gray-500">Текущий месяц: </span>
          <span className="font-medium text-gray-900">{dash ? fmMonthLabel(dash.current_month) : '—'}</span>
        </div>
        <div className="text-gray-500">
          Обновлено: {dash?.last_updated ? new Date(dash.last_updated).toLocaleString('ru-RU') : '—'}
        </div>
        <div className="text-gray-500">
          Авансы 12 мес: <span className="font-medium text-emerald-700">{fmMoney(annual)}</span> · Факт: <span className="font-medium text-indigo-700">{fmMoney(annualFact)}</span>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => { setTab('dashboard'); setTimeout(() => document.getElementById('fm-notifications')?.scrollIntoView({ behavior: 'smooth' }), 50); }}
          className="relative inline-flex items-center gap-1.5 text-gray-600 hover:text-gray-900"
          title="Уведомления"
        >
          <Icon name="Bell" size={18} />
          {(dash?.notifications.length || 0) > 0 && (
            <span className={`absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] leading-[18px] text-center text-white ${unread ? 'bg-rose-600' : 'bg-gray-400'}`}>
              {dash!.notifications.length}
            </span>
          )}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
          {SCENARIOS.map((sc) => (
            <button key={sc} onClick={() => onScenarioTop(sc)}
              className={`px-3 py-1.5 rounded-md text-sm ${active === sc ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white'}`}>
              {SCENARIO_LABEL[sc]}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50" title="Налоговый режим для текущего и будущих месяцев">
          {([['auto', 'Авто'], ['usn', 'УСН'], ['patent', 'Патент']] as [TaxRegimeGlobal, string][]).map(([v, l]) => (
            <button key={v} disabled={busyTop !== null} onClick={() => onTaxGlobal(v)}
              className={`px-3 py-1.5 rounded-md text-sm ${(dash?.tax_regime || 'auto') === v ? 'bg-sky-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
          {(['6m', '12m'] as CreditOption[]).map((o) => (
            <button key={o} disabled={busyTop !== null} onClick={() => onCreditTop(o)}
              className={`px-3 py-1.5 rounded-md text-sm ${credit!.option === o ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white'}`}>
              Кредит {o === '6m' ? '6' : '12'} мес
            </button>
          ))}
        </div>
        <div className="flex-1" />
        {monthOpen && (
          <button disabled={busyTop !== null} onClick={onCloseMonth}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 text-white text-sm disabled:opacity-50">
            <Icon name={busyTop === 'close' ? 'Loader2' : 'CalendarCheck'} size={15} className={busyTop === 'close' ? 'animate-spin' : ''} />
            Закрыть {dash ? fmMonthLabel(dash.prev_month) : 'месяц'}
          </button>
        )}
        <button disabled={busyTop !== null} onClick={onRecalc}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          <Icon name={busyTop === 'recalc' ? 'Loader2' : 'RefreshCw'} size={15} className={busyTop === 'recalc' ? 'animate-spin' : ''} />
          Пересчитать
        </button>
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
          <button disabled={busyTop !== null} onClick={() => onExport('xlsx')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            <Icon name={busyTop === 'export_xlsx' ? 'Loader2' : 'FileSpreadsheet'} size={15} className={busyTop === 'export_xlsx' ? 'animate-spin' : ''} />
            Excel
          </button>
          <button disabled={busyTop !== null} onClick={() => onExport('csv')} className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 border-l border-gray-200">CSV</button>
          <button disabled={busyTop !== null} onClick={() => onExport('pdf')} className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 border-l border-gray-200">PDF</button>
        </div>
      </div>
    </div>
  );
};

export default FinModelHeader;
