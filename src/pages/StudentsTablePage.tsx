import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import {
  StudentRow,
  StatusFilter,
  STATUS_FILTERS,
  matchesFilter,
  fetchStudents,
} from '@/lib/studentsApi';

type Tab = 'main' | 'progress' | 'vacations';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'main', label: 'Основное', icon: 'User' },
  { id: 'progress', label: 'Мониторинг прогресса', icon: 'TrendingUp' },
  { id: 'vacations', label: 'Даты каникул', icon: 'CalendarOff' },
];

const fmtDate = (d: string | null) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y}`;
};

const statusBadge = (statusId: number | null) => {
  if (statusId === 1) return 'bg-green-100 text-green-700';
  if (statusId === 5) return 'bg-amber-100 text-amber-700';
  if (statusId === 4) return 'bg-blue-100 text-blue-700';
  if (statusId === 3) return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
};

// Цвет точки статуса: зелёная-активен, жёлтая-каникулы, голубая-каникулы(заморожен),
// красная-бросил/завершил.
const statusDot = (statusId: number | null) => {
  if (statusId === 1) return 'bg-green-500';
  if (statusId === 5) return 'bg-amber-400';
  if (statusId === 4) return 'bg-sky-400';
  if (statusId === 3 || statusId === 2) return 'bg-red-500';
  return 'bg-gray-300';
};

const ageLabel = (age: number | null) => {
  if (!age) return '';
  const n = age % 100;
  const n1 = age % 10;
  if (n > 10 && n < 20) return `${age} лет`;
  if (n1 === 1) return `${age} год`;
  if (n1 >= 2 && n1 <= 4) return `${age} года`;
  return `${age} лет`;
};

const MainTable = ({ rows }: { rows: StudentRow[] }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-left">
            <th className="px-3 py-3 font-semibold w-12">№</th>
            <th className="px-3 py-3 font-semibold">Фамилия Имя</th>
            <th className="px-3 py-3 font-semibold">Возраст</th>
            <th className="px-3 py-3 font-semibold">Формы нарушений чтения и письма</th>
            <th className="px-3 py-3 font-semibold">Абонемент</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s, i) => (
            <tr key={s.id} className="border-t border-gray-100 hover:bg-purple-50/50">
              <td className="px-3 py-3 text-gray-400 align-top">{i + 1}</td>
              <td className="px-3 py-3 align-top font-medium text-gray-900">
                <span className="leading-snug">
                  {s.name}
                  <span
                    title={s.status_name}
                    className={`inline-block align-top ml-1 w-2 h-2 rounded-full ${statusDot(s.status_id)}`}
                  />
                </span>
              </td>
              <td className="px-3 py-3 text-gray-700 whitespace-nowrap align-top">
                {s.age ? ageLabel(s.age) : '—'}
              </td>
              <td className="px-3 py-3 text-gray-700 align-top">{s.conclusion || '—'}</td>
              <td className="px-3 py-3 align-top">
                {s.tariff ? (
                  <div className="flex flex-col">
                    <span className="text-gray-800">{s.tariff.name}</span>
                    <span
                      className={`text-xs ${s.tariff.is_active ? 'text-green-600' : 'text-gray-400'}`}
                    >
                      {s.tariff.is_active ? 'актуален' : 'закончен'}
                    </span>
                  </div>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const ProgressTable = ({ rows }: { rows: StudentRow[] }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-left">
            <th className="px-3 py-3 font-semibold">Фамилия Имя</th>
            <th className="px-3 py-3 font-semibold">Последняя диагностика</th>
            <th className="px-3 py-3 font-semibold">Следующая (ориентир)</th>
            <th className="px-3 py-3 font-semibold">Заключение</th>
            <th className="px-3 py-3 font-semibold">Рекомендации</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className="border-t border-gray-100 hover:bg-purple-50/50">
              <td className="px-3 py-3 font-medium text-gray-900 align-top">{s.name}</td>
              <td className="px-3 py-3 text-gray-700 whitespace-nowrap align-top">
                {fmtDate(s.last_diagnostic)}
              </td>
              <td className="px-3 py-3 text-gray-700 whitespace-nowrap align-top">
                {fmtDate(s.next_diagnostic)}
              </td>
              <td className="px-3 py-3 align-top">
                {s.report_link ? (
                  <a
                    href={s.report_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 hover:underline inline-flex items-center gap-1"
                  >
                    <Icon name="FileText" size={13} /> Открыть
                  </a>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-3 py-3 text-gray-600 align-top whitespace-pre-line max-w-md">
                {s.recommendations || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const Placeholder = ({ icon, title }: { icon: string; title: string }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
    <div className="inline-flex p-4 rounded-full bg-purple-100 mb-4">
      <Icon name={icon} size={32} className="text-purple-600" />
    </div>
    <p className="text-lg font-medium text-gray-500">Раздел «{title}» в разработке</p>
  </div>
);

const StudentsTablePage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('main');
  const [items, setItems] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all_active');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchStudents()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (!matchesFilter(i.status_id, filter)) return false;
      if (q && !(i.name || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, filter, search]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <AdminHeader showOnlyHome />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
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

          {tab === 'vacations' && <Placeholder icon="CalendarOff" title="Даты каникул" />}

          {(tab === 'main' || tab === 'progress') && (
            <>
              {/* Фильтры */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-5 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {STATUS_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilter(f.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        filter === f.id
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-purple-100'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <Input
                  placeholder="Поиск по ФИО"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-xs"
                />
              </div>

              {loading ? (
                <p className="text-gray-500">Загрузка…</p>
              ) : error ? (
                <p className="text-red-600">{error}</p>
              ) : filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                  Учеников по выбранному фильтру нет
                </div>
              ) : tab === 'main' ? (
                <MainTable rows={filtered} />
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