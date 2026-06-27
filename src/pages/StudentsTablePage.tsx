import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import DiagnosticDialog from '@/components/students/DiagnosticDialog';
import {
  StudentRow,
  StatusFilter,
  STATUS_FILTERS,
  matchesFilter,
  fetchStudents,
} from '@/lib/studentsApi';

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

const StudentsTablePage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all_active');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<StudentRow | null>(null);

  const load = () => {
    setLoading(true);
    setError('');
    fetchStudents()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
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
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => navigate('/admin/manager')}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icon name="Users" size={24} className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Ученики</h1>
              <p className="text-gray-500 text-sm">Статусы и диагностики</p>
            </div>
          </div>

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
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-left">
                      <th className="px-4 py-3 font-semibold">ФИО</th>
                      <th className="px-4 py-3 font-semibold">Статус</th>
                      <th className="px-4 py-3 font-semibold">Последняя диагностика</th>
                      <th className="px-4 py-3 font-semibold">Следующая (ориентир)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => setEditing(s)}
                        className="border-t border-gray-100 hover:bg-purple-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(s.status_id)}`}
                          >
                            {s.status_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <span className="inline-flex items-center gap-1">
                            {fmtDate(s.last_diagnostic)}
                            <Icon name="Pencil" size={13} className="text-gray-300" />
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{fmtDate(s.next_diagnostic)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-3">
            Нажмите на строку, чтобы внести данные по последней диагностике и рекомендации.
          </p>
        </div>
      </div>

      <DiagnosticDialog
        student={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    </div>
  );
};

export default StudentsTablePage;
