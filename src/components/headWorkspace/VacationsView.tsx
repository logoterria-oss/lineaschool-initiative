import Icon from '@/components/ui/icon';
import StudentsFilters from '@/components/students/StudentsFilters';
import StatusLegend from '@/components/students/StatusLegend';
import VacationsTable from '@/components/students/VacationsTable';
import { HintBox } from '@/components/students/studentsTableHelpers';
import ClientSchemeHint from '@/components/students/ClientSchemeModal';
import { useStudentsData } from '@/components/headWorkspace/useStudentsData';

const VacationsView = () => {
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
    vacationsRows,
    vacationsNoDate,
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
          compact
        />
      </div>

      <div className="mb-4 flex flex-wrap items-start gap-3">
        <HintBox
          className="flex-1 min-w-[280px]"
          title="Как работать с датами каникул"
          hints={[
            'Здесь ученики со статусом «Каникулы» или «Абонемент заморожен».',
            'Укажите дату начала каникул и дату возврата к занятиям (точную или ориентировочную — начало/середина/конец месяца).',
            'Строки без даты возврата подсвечиваются — по ним нужно уточнить сроки.',
            'В столбце «Комментарии» добавляйте заметки: выберите исполнителя и дату, опишите что сделано, ответ родителя и доп. комментарий. Записи можно редактировать и удалять.',
          ]}
        />
        <ClientSchemeHint className="flex-1 min-w-[280px]" />
      </div>

      <StatusLegend />

      {loading ? (
        <p className="text-gray-500">Загрузка…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-semibold text-gray-600">
              Всего: {vacationsRows.length}
            </span>
            {vacationsNoDate > 0 && (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">
                <Icon name="TriangleAlert" size={14} />
                Нет данных: {vacationsNoDate}
              </span>
            )}
          </div>
          <VacationsTable rows={vacationsRows} />
        </>
      )}
    </div>
  );
};

export default VacationsView;
