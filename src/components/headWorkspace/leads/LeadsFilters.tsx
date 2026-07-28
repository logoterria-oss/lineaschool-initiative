import Icon from '@/components/ui/icon';
import {
  RESPONSIBLE_OPTIONS,
  PROCESSING_OPTIONS,
  LEAD_STATUS_OPTIONS,
} from '@/lib/leadsApi';

interface LeadsFiltersProps {
  statsLoading: boolean;
  onCollectStats: () => void;
  onAddLead: () => void;
  onLoad: () => void;

  filtersOpen: boolean;
  setFiltersOpen: (v: boolean) => void;

  hasActiveFilters: boolean;
  activeFiltersCount: number;

  fSearch: string;
  setFSearch: (v: string) => void;
  fResponsible: string;
  setFResponsible: (v: string) => void;
  fProcessing: string;
  setFProcessing: (v: string) => void;
  fLeadStatus: string;
  setFLeadStatus: (v: string) => void;
  fDateFrom: string;
  setFDateFrom: (v: string) => void;
  fDateTo: string;
  setFDateTo: (v: string) => void;
  fUntouchedOnly: boolean;
  setFUntouchedOnly: (v: boolean) => void;
  fContactDue: boolean;
  setFContactDue: (v: boolean | ((p: boolean) => boolean)) => void;

  resetFilters: () => void;
  visibleCount: number;
}

// Панель действий (кнопки) + всплывающее окно фильтров.
export default function LeadsFilters({
  statsLoading,
  onCollectStats,
  onAddLead,
  onLoad,
  filtersOpen,
  setFiltersOpen,
  hasActiveFilters,
  activeFiltersCount,
  fSearch,
  setFSearch,
  fResponsible,
  setFResponsible,
  fProcessing,
  setFProcessing,
  fLeadStatus,
  setFLeadStatus,
  fDateFrom,
  setFDateFrom,
  fDateTo,
  setFDateTo,
  fUntouchedOnly,
  setFUntouchedOnly,
  fContactDue,
  setFContactDue,
  resetFilters,
  visibleCount,
}: LeadsFiltersProps) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          onClick={() => onCollectStats()}
          disabled={statsLoading}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors disabled:opacity-60"
        >
          <Icon name={statsLoading ? 'Loader2' : 'BarChart3'} size={18} className={statsLoading ? 'animate-spin' : ''} />
          Собрать статистику
        </button>
        <button
          onClick={onAddLead}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <Icon name="Plus" size={18} />
          Добавить лида
        </button>
        <button
          onClick={onLoad}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Icon name="RefreshCw" size={16} />
          Обновить
        </button>
        <button
          onClick={() => setFiltersOpen(true)}
          className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors border ${
            hasActiveFilters
              ? 'bg-amber-50 border-amber-300 text-amber-700'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Icon name="SlidersHorizontal" size={16} />
          Фильтры
          {hasActiveFilters && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-amber-500 text-white text-xs font-bold">
              {activeFiltersCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFContactDue((v) => !v)}
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors border ${
            fContactDue
              ? 'bg-orange-500 border-orange-500 text-white'
              : 'bg-white border-orange-300 text-orange-600 hover:bg-orange-50'
          }`}
        >
          <Icon name="PhoneCall" size={16} />
          Пора связаться
        </button>
        <div className="text-sm text-gray-400 ml-auto flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-100 border border-red-300" />
          новый необработанный лид
        </div>
      </div>

      {filtersOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
          onClick={() => setFiltersOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Icon name="SlidersHorizontal" size={18} className="text-amber-600" />
                Фильтры
              </h3>
              <button onClick={() => setFiltersOpen(false)} className="text-gray-400 hover:text-gray-700">
                <Icon name="X" size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Поиск по ФИО</label>
                <div className="relative">
                  <Icon name="Search" size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={fSearch}
                    onChange={(e) => setFSearch(e.target.value)}
                    placeholder="Родитель или ученик"
                    className="w-full border border-gray-300 rounded-lg pl-8 pr-2.5 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Ответственный</label>
                <select
                  value={fResponsible}
                  onChange={(e) => setFResponsible(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none focus:border-amber-400 bg-white"
                >
                  <option value="">Все</option>
                  {RESPONSIBLE_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Статус обработки</label>
                <select
                  value={fProcessing}
                  onChange={(e) => setFProcessing(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none focus:border-amber-400 bg-white"
                >
                  <option value="">Все</option>
                  {PROCESSING_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Статус лида</label>
                <select
                  value={fLeadStatus}
                  onChange={(e) => setFLeadStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none focus:border-amber-400 bg-white"
                >
                  <option value="">Все</option>
                  {LEAD_STATUS_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Дата заявки с</label>
                  <input
                    type="date"
                    value={fDateFrom}
                    onChange={(e) => setFDateFrom(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">по</label>
                  <input
                    type="date"
                    value={fDateTo}
                    onChange={(e) => setFDateTo(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={fUntouchedOnly}
                  onChange={(e) => setFUntouchedOnly(e.target.checked)}
                  className="w-4 h-4 accent-red-500"
                />
                <span className="text-sm text-gray-700">Только необработанные (новые) лиды</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={fContactDue}
                  onChange={(e) => setFContactDue(e.target.checked)}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-sm text-gray-700">Пора связаться (наступил срок или просрочено)</span>
              </label>
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100">
              <button
                onClick={resetFilters}
                className="text-sm font-medium text-gray-500 hover:text-gray-800"
              >
                Сбросить всё
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Найдено: {visibleCount}</span>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
                >
                  Показать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
