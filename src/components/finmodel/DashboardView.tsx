import Icon from '@/components/ui/icon';
import { DashboardData, Scenario } from '@/lib/finmodelApi';
import DashboardKpi from './DashboardKpi';
import DashboardCharts from './DashboardCharts';
import DashboardNotifications from './DashboardNotifications';
import { DataSourcesBlock, ManualInputsBlock } from './DashboardSidePanels';

interface Props {
  data: DashboardData;
  active: Scenario;
  onGo: (target: string) => void;
  onWhatIf: (view: 'sensitivity' | 'manager') => void;
  onNotif: (op: 'dismiss' | 'snooze' | 'read' | 'restore', id?: number) => Promise<void>;
  onCloseMonth: () => void;
  onChanged: () => Promise<void>;
}

const WHAT_IF = [
  { view: 'sensitivity' as const, icon: 'SlidersHorizontal', title: 'Чувствительность', text: 'Цена, ученики, реклама, сотрудники — слайдеры и таблицы по трём сценариям' },
  { view: 'manager' as const, icon: 'Layers', title: 'Диспетчер сценариев', text: 'База, +4 сотрудника, цена −10%, реклама −50%, кредит 12 мес и свои сценарии' },
];

const DashboardView = ({ data, active, onGo, onWhatIf, onNotif, onCloseMonth, onChanged }: Props) => (
  <div className="space-y-4">
    {data.notifications.some((n) => n.priority === 'high') && (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex flex-wrap items-center gap-3 text-sm">
        <Icon name="TriangleAlert" size={18} className="text-rose-600" />
        <div className="flex-1 min-w-[200px] text-rose-900">
          {data.notifications.filter((n) => n.priority === 'high').map((n) => (
            <div key={n.id}>{n.message}</div>
          ))}
        </div>
        <button
          onClick={() => document.getElementById('fm-notifications')?.scrollIntoView({ behavior: 'smooth' })}
          className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 text-xs"
        >
          Все уведомления ({data.notifications.length})
        </button>
      </div>
    )}
    <DashboardKpi data={data} active={active} />
    <DashboardCharts data={data} active={active} />

    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="FlaskConical" size={18} className="text-gray-500" />
        <h3 className="font-semibold text-gray-900">Что если</h3>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {WHAT_IF.map((w) => (
          <button key={w.view} onClick={() => onWhatIf(w.view)}
            className="text-left rounded-lg border border-gray-200 p-4 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors flex gap-3">
            <Icon name={w.icon} size={20} className="text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900">{w.title}</div>
              <div className="text-xs text-gray-500">{w.text}</div>
            </div>
          </button>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ManualInputsBlock data={data} onChanged={onChanged} onGo={onGo} />
      <DataSourcesBlock data={data} />
    </div>

    <DashboardNotifications data={data} onAction={onNotif} onGo={onGo} onCloseMonth={onCloseMonth} />
  </div>
);

export default DashboardView;
