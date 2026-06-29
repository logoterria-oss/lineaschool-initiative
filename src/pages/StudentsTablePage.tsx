import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import Icon from '@/components/ui/icon';
import {
  StudentRow,
  StatusFilter,
  matchesFilter,
  fetchStudents,
  saveStudentOverride,
} from '@/lib/studentsApi';
import {
  Tab,
  TABS,
} from '@/components/students/studentsTableHelpers';
import MainTable from '@/components/students/MainTable';
import ProgressTable from '@/components/students/ProgressTable';
import VacationsTable from '@/components/students/VacationsTable';
import StudentsFilters from '@/components/students/StudentsFilters';

const StudentsTablePage = () => {
  const navigate = useNavigate();
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

  // Уникальные названия абонементов для мультиселекта.
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

  // Ручная правка форм нарушений: сохраняем и обновляем строку локально.
  const handleSaveConclusion = async (id: number, value: string) => {
    await saveStudentOverride(id, { conclusion: value });
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, conclusion: value.trim(), conclusion_manual: true } : it,
      ),
    );
  };

  // Ручная правка возраста: сохраняем и обновляем строку локально.
  const handleSaveAge = async (id: number, age: number | null) => {
    await saveStudentOverride(id, { age });
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, age, age_manual: age != null } : it,
      ),
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

  // Вкладка "Даты каникул": ученики с действующими/будущими приостановками > 1 недели.
  const vacationsRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (q && !(i.name || '').toLowerCase().includes(q)) return false;
      return (i.vacations ?? []).length > 0;
    });
  }, [items, search]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <AdminHeader showOnlyHome />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin/manager')}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <Icon name="ArrowLeft" size={20} />
              </button>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Icon name="Users" size={24} className="text-purple-600" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Ученики</h1>
            </div>

            {(tab === 'main' || tab === 'progress') && (
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

          {/* Навигация */}
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
              {loading ? (
                <p className="text-gray-500">Загрузка…</p>
              ) : error ? (
                <p className="text-red-600">{error}</p>
              ) : (
                <VacationsTable rows={vacationsRows} />
              )}
            </>
          )}

          {(tab === 'main' || tab === 'progress') && (
            <>
              {loading ? (
                <p className="text-gray-500">Загрузка…</p>
              ) : error ? (
                <p className="text-red-600">{error}</p>
              ) : filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                  Учеников по выбранному фильтру нет
                </div>
              ) : tab === 'main' ? (
                <MainTable
                  rows={filtered}
                  onSaveConclusion={handleSaveConclusion}
                  onSaveAge={handleSaveAge}
                />
              ) : (
                <ProgressTable rows={filtered} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentsTablePage;