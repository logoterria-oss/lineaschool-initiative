import StudentsFilters from '@/components/students/StudentsFilters';
import StatusLegend from '@/components/students/StatusLegend';
import ProgressTable from '@/components/students/ProgressTable';
import { HintBox } from '@/components/students/studentsTableHelpers';
import ClientSchemeHint from '@/components/students/ClientSchemeModal';
import { useStudentsData } from '@/components/headWorkspace/useStudentsData';

const ProgressMonitoringView = () => {
  const {
    loading,
    error,
    filter,
    setFilter,
    tariffFilter,
    setTariffFilter,
    toggleTariff,
    tariffOptions,
    search,
    setSearch,
    filtered,
  } = useStudentsData();

  return (
    <div>
      <div className="flex items-start justify-end gap-3 mb-6 flex-wrap">
        <StudentsFilters
          filter={filter}
          setFilter={setFilter}
          tariffFilter={tariffFilter}
          setTariffFilter={setTariffFilter}
          toggleTariff={toggleTariff}
          tariffOptions={tariffOptions}
          search={search}
          setSearch={setSearch}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-start gap-3">
        <HintBox
          className="flex-1 min-w-[280px]"
          title="Как работать с мониторингом прогресса"
          hints={[
            'Раздел показывает динамику диагностик по каждому ученику.',
            'Цветные метки — типы диагностик (первичная, повторная, запланированная); наведите для деталей.',
            'Отслеживайте даты последней и следующей диагностики, чтобы вовремя назначить встречу.',
            'Используйте фильтры и поиск сверху, чтобы быстро найти нужных учеников.',
          ]}
        />
        <ClientSchemeHint className="flex-1 min-w-[280px]" />
      </div>

      <StatusLegend />

      {loading ? (
        <p className="text-gray-500">Загружаем данные из AlfaCRM. Это может занять несколько минут...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          Учеников по выбранному фильтру нет
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold text-gray-600 mb-3">Всего: {filtered.length}</p>
          <ProgressTable rows={filtered} />
        </>
      )}
    </div>
  );
};

export default ProgressMonitoringView;