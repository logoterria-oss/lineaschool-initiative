import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  StudentRow,
  StatusFilter,
  STATUS_FILTERS,
  matchesFilter,
  fetchStudents,
  saveStudentOverride,
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

// Точка-статус ведёт себя как последняя буква имени: приклеена к последнему слову,
// поэтому не отрывается и не съезжает при переносе ФИ на несколько строк.
const NameWithDot = ({
  name,
  statusId,
  statusName,
}: {
  name: string;
  statusId: number | null;
  statusName: string;
}) => {
  const parts = (name || '').trim().split(' ');
  const last = parts.pop() || '';
  const head = parts.join(' ');
  return (
    <span className="leading-snug">
      {head && `${head} `}
      <span className="whitespace-nowrap">
        {last}
        <span
          title={statusName}
          className={`inline-block ml-1 w-2 h-2 rounded-full ${statusDot(statusId)}`}
        />
      </span>
    </span>
  );
};

const ConclusionCell = ({
  s,
  onSave,
}: {
  s: StudentRow;
  onSave: (id: number, value: string) => Promise<void>;
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(s.conclusion);
  const [saving, setSaving] = useState(false);

  const start = () => {
    setValue(s.conclusion);
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(s.id, value);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <td className="px-3 py-3 align-top">
        <Textarea
          rows={3}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="text-sm"
          placeholder="Формы нарушений чтения и письма"
        />
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
            Отмена
          </Button>
        </div>
      </td>
    );
  }

  return (
    <td className="px-3 py-3 text-gray-700 align-top group">
      <div className="flex items-start gap-2">
        <span className="flex-1">
          {s.conclusion || '—'}
          {s.conclusion_manual && (
            <span className="ml-1 text-[10px] text-purple-500 align-middle">(вручную)</span>
          )}
        </span>
        <button
          onClick={start}
          title="Редактировать"
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-purple-600 transition-opacity flex-shrink-0"
        >
          <Icon name="Pencil" size={14} />
        </button>
      </div>
    </td>
  );
};

const MainTable = ({
  rows,
  onSaveConclusion,
}: {
  rows: StudentRow[];
  onSaveConclusion: (id: number, value: string) => Promise<void>;
}) => (
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
                <NameWithDot name={s.name} statusId={s.status_id} statusName={s.status_name} />
              </td>
              <td className="px-3 py-3 text-gray-700 whitespace-nowrap align-top">
                {s.age ? ageLabel(s.age) : '—'}
              </td>
              <ConclusionCell s={s} onSave={onSaveConclusion} />
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
    await saveStudentOverride(id, value);
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, conclusion: value.trim(), conclusion_manual: true } : it,
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
              <div className="flex flex-wrap items-center gap-2">
                {/* Статус */}
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as StatusFilter)}
                  className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {STATUS_FILTERS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>

                {/* Абонемент (мультиселект) */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm text-gray-700 inline-flex items-center gap-1.5 hover:border-purple-300">
                      <Icon name="Ticket" size={15} className="text-gray-400" />
                      Абонемент
                      {tariffFilter.length > 0 && (
                        <span className="ml-0.5 text-xs bg-purple-600 text-white rounded-full px-1.5">
                          {tariffFilter.length}
                        </span>
                      )}
                      <Icon name="ChevronDown" size={14} className="text-gray-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-72 p-2 max-h-80 overflow-y-auto">
                    {tariffFilter.length > 0 && (
                      <button
                        onClick={() => setTariffFilter([])}
                        className="w-full text-left text-xs text-purple-600 hover:underline px-2 py-1 mb-1"
                      >
                        Сбросить выбор
                      </button>
                    )}
                    {tariffOptions.length === 0 ? (
                      <p className="text-sm text-gray-400 px-2 py-1">Нет данных</p>
                    ) : (
                      tariffOptions.map((name) => (
                        <label
                          key={name}
                          className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <Checkbox
                            checked={tariffFilter.includes(name)}
                            onCheckedChange={() => toggleTariff(name)}
                            className="mt-0.5"
                          />
                          <span className="text-sm text-gray-700 leading-snug">{name}</span>
                        </label>
                      ))
                    )}
                  </PopoverContent>
                </Popover>

                {/* Поиск */}
                <Input
                  placeholder="Поиск по ФИО"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-44"
                />
              </div>
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

          {tab === 'vacations' && <Placeholder icon="CalendarOff" title="Даты каникул" />}

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
                <MainTable rows={filtered} onSaveConclusion={handleSaveConclusion} />
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