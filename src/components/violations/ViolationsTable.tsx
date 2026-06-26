import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import {
  Violation,
  fetchViolations,
  deleteViolation,
} from '@/lib/violationsApi';
import { GROUP_TEACHERS, INDIVIDUAL_TEACHERS } from '@/lib/supervisionChecklist';
import {
  MONTHS,
  QUARTERS,
  monthStart,
  monthEnd,
  PeriodMode,
} from '@/lib/supervisionPeriod';

const ALL_TEACHERS = [...INDIVIDUAL_TEACHERS, ...GROUP_TEACHERS];

const selectCls =
  'h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-400';

const fmtDate = (d: string | null) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y}`;
};

const ViolationsTable = ({ reloadKey }: { reloadKey?: number }) => {
  const now = new Date();
  const [items, setItems] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teacherFilter, setTeacherFilter] = useState<number | ''>('');
  const [periodMode, setPeriodMode] = useState<PeriodMode>('quarter');
  const [periodEnabled, setPeriodEnabled] = useState(false);
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);
  const [fromMonth, setFromMonth] = useState(0);
  const [toMonth, setToMonth] = useState(now.getMonth());
  const [openDispute, setOpenDispute] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await fetchViolations());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [reloadKey]);

  const years = useMemo(() => {
    const y = now.getFullYear();
    return [y - 2, y - 1, y, y + 1];
  }, [now]);

  const period = useMemo(() => {
    if (periodMode === 'quarter') {
      const q = QUARTERS.find((x) => x.id === quarter)!;
      return { from: monthStart(year, q.from), to: monthEnd(year, q.to) };
    }
    const lo = Math.min(fromMonth, toMonth);
    const hi = Math.max(fromMonth, toMonth);
    return { from: monthStart(year, lo), to: monthEnd(year, hi) };
  }, [periodMode, quarter, fromMonth, toMonth, year]);

  const filtered = useMemo(
    () =>
      items.filter((i) => {
        if (teacherFilter && i.teacher_id !== teacherFilter) return false;
        if (periodEnabled) {
          if (i.violation_date < period.from || i.violation_date > period.to) return false;
        }
        return true;
      }),
    [items, teacherFilter, periodEnabled, period],
  );

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить это нарушение?')) return;
    await deleteViolation(id);
    await load();
  };

  if (loading) return <p className="text-gray-500">Загрузка…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      {/* Фильтры */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Педагог (ФИО)</label>
            <select
              className={selectCls}
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Все</option>
              {ALL_TEACHERS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 h-10">
            <input
              type="checkbox"
              checked={periodEnabled}
              onChange={(e) => setPeriodEnabled(e.target.checked)}
              className="w-4 h-4 accent-red-600"
            />
            Фильтр по периоду
          </label>
        </div>

        {periodEnabled && (
          <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-gray-100">
            <div className="flex gap-2">
              <button
                onClick={() => setPeriodMode('quarter')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                  periodMode === 'quarter' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Квартал
              </button>
              <button
                onClick={() => setPeriodMode('range')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                  periodMode === 'range' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Диапазон месяцев
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500">Год</label>
              <select className={selectCls} value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {periodMode === 'quarter' ? (
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Квартал</label>
                <select
                  className={selectCls}
                  value={quarter}
                  onChange={(e) => setQuarter(Number(e.target.value))}
                >
                  {QUARTERS.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">С месяца</label>
                  <select
                    className={selectCls}
                    value={fromMonth}
                    onChange={(e) => setFromMonth(Number(e.target.value))}
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">По месяц</label>
                  <select
                    className={selectCls}
                    value={toMonth}
                    onChange={(e) => setToMonth(Number(e.target.value))}
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          {items.length === 0 ? 'Нарушений пока нет' : 'По выбранным фильтрам ничего не найдено'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((v) => (
            <div key={v.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900">{v.teacher_name}</div>
                  <div className="text-sm text-gray-500">{fmtDate(v.violation_date)}</div>
                  <div className="text-sm text-gray-800 mt-1">{v.violation_title}</div>
                  {v.admin_comment && (
                    <div className="text-sm text-gray-600 mt-1">Комментарий: {v.admin_comment}</div>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Удалить"
                  >
                    <Icon name="Trash2" size={16} />
                  </button>
                </div>
              </div>

              {v.dispute_status === 'disputed' && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setOpenDispute(openDispute === v.id ? null : v.id)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700"
                  >
                    <Icon name="MessageSquareWarning" size={16} />
                    Педагог оспорил нарушение
                    <Icon
                      name="ChevronDown"
                      size={14}
                      className={`transition-transform ${openDispute === v.id ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openDispute === v.id && (
                    <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg p-3 space-y-2">
                      {v.dispute_comment && (
                        <p className="text-sm text-gray-700 whitespace-pre-line">{v.dispute_comment}</p>
                      )}
                      {v.dispute_photos.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {v.dispute_photos.map((url) => (
                            <a key={url} href={url} target="_blank" rel="noreferrer">
                              <img
                                src={url}
                                alt="Доказательство"
                                className="w-20 h-20 object-cover rounded-lg border border-amber-200"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViolationsTable;