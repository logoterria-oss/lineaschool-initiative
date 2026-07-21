import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import {
  StudentRow,
  StatusFilter,
  matchesFilter,
  fetchStudents,
  saveStudentOverride,
} from '@/lib/studentsApi';
import { Tab, TABS, HintBox } from '@/components/students/studentsTableHelpers';
import MainTable from '@/components/students/MainTable';
import ProgressTable from '@/components/students/ProgressTable';
import VacationsTable from '@/components/students/VacationsTable';
import InteractionsTable from '@/components/students/InteractionsTable';
import StudentsFilters from '@/components/students/StudentsFilters';
import StatusLegend from '@/components/students/StatusLegend';
import ClientSchemeHint from '@/components/students/ClientSchemeModal';

const StudentsView = () => {
  const [tab, setTab] = useState<Tab>('main');
  const [items, setItems] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all_active');
  const [tariffFilter, setTariffFilter] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchStudents()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, []);

  const tariffOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.tariff?.name) set.add(i.tariff.name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [items]);

  const toggleTariff = (name: string) =>
    setTariffFilter((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    );

  const handleSaveConclusion = async (id: number, value: string) => {
    await saveStudentOverride(id, { conclusion: value });
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, conclusion: value.trim(), conclusion_manual: true } : it,
      ),
    );
  };

  const handleSaveAge = async (id: number, age: number | null) => {
    await saveStudentOverride(id, { age });
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, age, age_manual: age != null } : it)),
    );
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (!matchesFilter(i.status_id, filter)) return false;
      if (tariffFilter.length && !(i.tariff && tariffFilter.includes(i.tariff.name)))
        return false;
      if (q && !(i.name || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, filter, tariffFilter, search]);

  const vacationsRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (i.status_id !== 4 && i.status_id !== 5) return false;
      if (q && !(i.name || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, search]);

  const vacationsNoDate = useMemo(
    () => vacationsRows.filter((i) => !i.vacation?.date_to).length,
    [vacationsRows],
  );

  return (
    <div>
      <div className="flex items-start justify-end gap-3 mb-6 flex-wrap">
        {(tab === 'main' || tab === 'progress' || tab === 'interactions') && (
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
        )}
        {tab === 'vacations' && (
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
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-colors ${
              tab === t.id
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
            }`}
          >
            <Icon name={t.icon} size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'vacations' && (
        <>
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
            <p className="text-gray-500">Загружаем данные из AlfaCRM. Это может занять несколько минут...</p>
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
        </>
      )}

      {(tab === 'main' || tab === 'progress' || tab === 'interactions') && (
        <>
          {(tab === 'interactions' || tab === 'progress') && (
            <div className="mb-4 flex flex-wrap items-start gap-3">
              {tab === 'interactions' && (
                <HintBox
                  className="flex-1 min-w-[280px]"
                  title="Как работать с взаимодействиями"
                  hints={[
                    'Все ученики по умолчанию «ок». Нажмите «не ок», чтобы пометить обращение, которое нельзя потерять — такой ученик поднимется вверх списка.',
                    'В колонке «Взаимодействия» создайте запись: выберите, от кого запрос (родитель / педагог / админ), укажите дату и текст.',
                    'Добавьте один или несколько ответов (от кого, дата, текст) и опишите, что сделано.',
                    'Поставьте галочку «Готово» — запись свернётся в одну строку, историю всегда можно развернуть стрелкой.',
                  ]}
                />
              )}
              {tab === 'progress' && (
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
              )}
              <ClientSchemeHint className="flex-1 min-w-[280px]" />
            </div>
          )}
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
              {tab === 'main' && (
                <MainTable
                  rows={filtered}
                  onSaveConclusion={handleSaveConclusion}
                  onSaveAge={handleSaveAge}
                />
              )}
              {tab === 'progress' && <ProgressTable rows={filtered} />}
              {tab === 'interactions' && <InteractionsTable rows={filtered} />}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default StudentsView;