import { LeadsStats } from '@/lib/leadsApi';
import Icon from '@/components/ui/icon';

interface Props {
  stats: LeadsStats;
  onClose: () => void;
}

const Row = ({ items }: { items: Record<string, number> }) => (
  <div className="space-y-1.5">
    {Object.entries(items)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => (
        <div key={k} className="flex items-center justify-between text-sm">
          <span className="text-gray-600 truncate pr-2">{k}</span>
          <span className="font-semibold text-gray-900">{v}</span>
        </div>
      ))}
  </div>
);

export default function LeadsStatsPanel({ stats, onClose }: Props) {
  return (
    <div className="mb-5 bg-gradient-to-b from-amber-50 to-white border border-amber-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Icon name="BarChart3" size={20} className="text-amber-600" />
          Статистика по лидам
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
          <Icon name="X" size={20} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500">Всего лидов</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.clients}</div>
          <div className="text-xs text-gray-500">Клиентов</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-cyan-600">{stats.conv_to_diag}%</div>
          <div className="text-xs text-gray-500">Дошли до диагностики</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">{stats.conv_to_client}%</div>
          <div className="text-xs text-gray-500">Стали клиентами</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">По статусу лида</h3>
          <Row items={stats.by_lead_status} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">По статусу обработки</h3>
          <Row items={stats.by_processing} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">По месяцам</h3>
          <Row items={stats.by_month} />
        </div>
      </div>
    </div>
  );
}
