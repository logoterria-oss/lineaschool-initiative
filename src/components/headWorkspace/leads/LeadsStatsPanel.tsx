import { LeadsStats } from '@/lib/leadsApi';
import Icon from '@/components/ui/icon';

interface Props {
  stats: LeadsStats | null;
  loading: boolean;
  dateFrom: string;
  dateTo: string;
  onChangeFrom: (v: string) => void;
  onChangeTo: (v: string) => void;
  onApply: () => void;
  onPreset: (from: string, to: string) => void;
  onClose: () => void;
}

const Row = ({ items }: { items: Record<string, number> }) => (
  <div className="space-y-1.5">
    {Object.entries(items).length === 0 && <div className="text-sm text-gray-400">Нет данных</div>}
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

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getPresets() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return [
    { label: 'Этот месяц', from: iso(new Date(y, m, 1)), to: iso(now) },
    { label: 'Прошлый месяц', from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0)) },
    { label: 'Последние 30 дней', from: iso(new Date(now.getTime() - 29 * 86400000)), to: iso(now) },
    { label: 'С начала года', from: iso(new Date(y, 0, 1)), to: iso(now) },
    { label: 'Всё время', from: '', to: '' },
  ];
}

export default function LeadsStatsPanel({
  stats, loading, dateFrom, dateTo, onChangeFrom, onChangeTo, onApply, onPreset, onClose,
}: Props) {
  const periodText = dateFrom || dateTo ? `${dateFrom || '…'} — ${dateTo || '…'}` : 'за всё время';

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

      {/* Выбор периода — для оценки рекламных кампаний */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="text-xs font-semibold text-gray-500 mb-2">Период (по дате заявки)</div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">С</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onChangeFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">По</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onChangeTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-amber-400"
            />
          </div>
          <button
            onClick={onApply}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Icon name="Search" size={15} />
            Показать
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {getPresets().map((p) => (
            <button
              key={p.label}
              onClick={() => onPreset(p.from, p.to)}
              className="text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full px-3 py-1 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading || !stats ? (
        <div className="py-10 text-center text-gray-400">
          <Icon name="Loader2" size={26} className="animate-spin mx-auto mb-2" />
          Считаю статистику…
        </div>
      ) : (
        <>
          <div className="text-xs text-gray-500 mb-3">Показано {periodText}</div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">По статусу лида</h3>
              <Row items={stats.by_lead_status} />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">По статусу обработки</h3>
              <Row items={stats.by_processing} />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">По ответственным</h3>
              <Row items={stats.by_responsible} />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">По месяцам</h3>
              <Row items={stats.by_month} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
