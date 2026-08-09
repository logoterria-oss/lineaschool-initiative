import StudentsFilters from '@/components/students/StudentsFilters';
import StatusLegend from '@/components/students/StatusLegend';
import MainTable from '@/components/students/MainTable';
import Icon from '@/components/ui/icon';
import { useStudentsData } from '@/components/headWorkspace/useStudentsData';

const StudentsListView = () => {
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
    handleSaveConclusion,
    handleSaveAge,
    handleSaveCity,
    filtered,
    refresh,
  } = useStudentsData();

  return (
    <div>
      <div className="flex items-start justify-end gap-3 mb-6 flex-wrap">
        {/* Данные кешируются на 5 минут — кнопка нужна, чтобы подтянуть
            свежие правки, сделанные в это время прямо в AlfaCRM */}
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          title="Загрузить свежие данные из AlfaCRM"
        >
          <Icon name="RefreshCw" size={15} className={loading ? 'animate-spin' : ''} />
          Обновить
        </button>
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

      <StatusLegend />

      {loading ? (
        <p className="text-gray-500">Загружаем данные из AlfaCRM...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          Учеников по выбранному фильтру нет
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold text-gray-600 mb-3">Всего: {filtered.length}</p>
          <MainTable
            rows={filtered}
            onSaveConclusion={handleSaveConclusion}
            onSaveAge={handleSaveAge}
            onSaveCity={handleSaveCity}
          />
        </>
      )}
    </div>
  );
};

export default StudentsListView;