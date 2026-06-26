import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import {
  Supervision,
  fetchSupervisions,
} from '@/lib/supervisionsApi';
import {
  GROUP_TEACHERS,
  INDIVIDUAL_TEACHERS,
  CHECKLIST_BY_FORM,
  LessonForm,
} from '@/lib/supervisionChecklist';
import SupervisionCard from './SupervisionCard';

const ALL_TEACHERS = [...INDIVIDUAL_TEACHERS, ...GROUP_TEACHERS];

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const QUARTERS = [
  { id: 1, label: 'I квартал (янв – мар)', from: 0, to: 2 },
  { id: 2, label: 'II квартал (апр – июн)', from: 3, to: 5 },
  { id: 3, label: 'III квартал (июл – сен)', from: 6, to: 8 },
  { id: 4, label: 'IV квартал (окт – дек)', from: 9, to: 11 },
];

const selectCls =
  'h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400';

const fmtDate = (d: string | null) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y}`;
};

const monthStart = (year: number, month: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}-01`;

const monthEnd = (year: number, month: number) => {
  const last = new Date(year, month + 1, 0).getDate();
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
};

type Mode = 'quarter' | 'range';

// Цвет строки критерия по доле среднего балла от максимума.
const criterionStyle = (avg: number, max: number) => {
  const ratio = max > 0 ? avg / max : 1;
  if (ratio < 0.6) return { row: 'bg-red-50', score: 'text-red-600' };
  if (ratio < 0.85) return { row: 'bg-amber-50', score: 'text-amber-600' };
  return { row: '', score: 'text-emerald-600' };
};

const TeacherSupervisions = () => {
  const now = new Date();
  const [teacherId, setTeacherId] = useState<number | ''>('');
  const [mode, setMode] = useState<Mode>('quarter');
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);
  const [fromMonth, setFromMonth] = useState(0);
  const [toMonth, setToMonth] = useState(now.getMonth());
  const [showCriteria, setShowCriteria] = useState(false);

  const [items, setItems] = useState<Supervision[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const years = useMemo(() => {
    const y = now.getFullYear();
    return [y - 2, y - 1, y, y + 1];
  }, [now]);

  const period = useMemo(() => {
    if (mode === 'quarter') {
      const q = QUARTERS.find((x) => x.id === quarter)!;
      return { from: monthStart(year, q.from), to: monthEnd(year, q.to) };
    }
    const lo = Math.min(fromMonth, toMonth);
    const hi = Math.max(fromMonth, toMonth);
    return { from: monthStart(year, lo), to: monthEnd(year, hi) };
  }, [mode, quarter, fromMonth, toMonth, year]);

  useEffect(() => {
    if (!teacherId) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError('');
    fetchSupervisions({ teacher_id: teacherId, date_from: period.from, date_to: period.to })
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [teacherId, period.from, period.to]);

  const avg = useMemo(() => {
    if (items.length === 0) return null;
    const sum = items.reduce((s, i) => s + i.total_score, 0);
    return Math.round((sum / items.length) * 10) / 10;
  }, [items]);

  // Средний балл по каждому критерию по всем супервизиям педагога за период.
  // Критерии у групповых и индивидуальных разные, поэтому считаем по каждой форме отдельно.
  const criteriaAverages = useMemo(() => {
    const forms: LessonForm[] = ['individual', 'group'];
    return forms
      .map((form) => {
        const formItems = items.filter((i) => i.lesson_form === form);
        if (formItems.length === 0) return null;
        const groups = CHECKLIST_BY_FORM[form].map((g) => ({
          group: g.group,
          items: g.items.map((it) => {
            const sum = formItems.reduce((s, sup) => s + (Number(sup.scores?.[it.key]) || 0), 0);
            return {
              key: it.key,
              criterion: it.criterion,
              max: it.max,
              avg: Math.round((sum / formItems.length) * 10) / 10,
            };
          }),
        }));
        return { form, count: formItems.length, groups };
      })
      .filter(Boolean) as {
      form: LessonForm;
      count: number;
      groups: { group: string; items: { key: string; criterion: string; max: number; avg: number }[] }[];
    }[];
  }, [items]);

  return (
    <div className="space-y-5">
      {/* Выбор педагога */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-gray-700">Педагог</label>
        <select
          className={`${selectCls} w-full`}
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">— выберите педагога —</option>
          {ALL_TEACHERS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Выбор периода */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('quarter')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === 'quarter'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-indigo-100'
            }`}
          >
            Квартал
          </button>
          <button
            onClick={() => setMode('range')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === 'range'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-indigo-100'
            }`}
          >
            Диапазон месяцев
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
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

          {mode === 'quarter' ? (
            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-xs text-gray-500">Квартал</label>
              <select
                className={`${selectCls} w-full`}
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
      </div>

      {/* Средний балл */}
      {teacherId !== '' && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-indigo-100">
              <Icon name="Award" size={24} className="text-indigo-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Средний балл за период</div>
              <div className="text-2xl font-bold text-gray-900">
                {avg !== null ? avg : '—'}
                <span className="text-sm font-normal text-gray-400"> · супервизий: {items.length}</span>
              </div>
            </div>
          </div>

          {criteriaAverages.length > 0 && (
            <>
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => setShowCriteria((v) => !v)}
                  className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Средний балл по критериям
                  <Icon
                    name="ChevronDown"
                    size={16}
                    className={`transition-transform ${showCriteria ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>

              {showCriteria && (
                <div className="mt-3 space-y-4">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm bg-red-200" /> ниже 60%
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm bg-amber-200" /> 60–85%
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm bg-emerald-200" /> выше 85%
                    </span>
                  </div>
                  {criteriaAverages.map((block) => (
                    <div key={block.form}>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                        {block.form === 'group' ? 'Групповые' : 'Индивидуальные'} · супервизий: {block.count}
                      </div>
                      <div className="space-y-3">
                        {block.groups.map((g) => (
                          <div key={g.group}>
                            <div className="text-xs font-semibold text-gray-500 mb-1">{g.group}</div>
                            <div className="divide-y divide-indigo-100 bg-white rounded-lg border border-indigo-100">
                              {g.items.map((it) => {
                                const st = criterionStyle(it.avg, it.max);
                                return (
                                  <div
                                    key={it.key}
                                    className={`flex items-center justify-between gap-3 px-3 py-2 ${st.row}`}
                                  >
                                    <span className="text-sm text-gray-700">{it.criterion}</span>
                                    <span className={`text-sm font-semibold flex-shrink-0 ${st.score}`}>
                                      {it.avg}
                                      <span className="text-gray-400 font-normal"> / {it.max}</span>
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Список */}
      {loading ? (
        <p className="text-gray-500">Загрузка…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : teacherId === '' ? (
        <p className="text-gray-400 text-sm">Выберите педагога, чтобы увидеть супервизии.</p>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          За выбранный период супервизий нет
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <SupervisionCard key={s.id} s={s} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherSupervisions;