import StudentsFilters from '@/components/students/StudentsFilters';
import StatusLegend from '@/components/students/StatusLegend';
import MainTable from '@/components/students/MainTable';
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
          <MainTable rows={filtered} onSaveConclusion={handleSaveConclusion} onSaveAge={handleSaveAge} />
        </>
      )}
    </div>
  );
};

export default StudentsListView;