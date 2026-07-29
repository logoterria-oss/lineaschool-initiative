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
  maxTotalScore,
} from '@/lib/supervisionChecklist';
import SupervisionCard from './SupervisionCard';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

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

const TeacherSupervisions = (
  { lockedTeacherId = null }: { lockedTeacherId?: number | null } = {},
) => {
  const now = new Date();
  const [teacherId, setTeacherId] = useState<number | ''>(lockedTeacherId ?? '');
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

  // Форма работы выбранного педагога (групповой / индивидуальный).
  const teacherForm: LessonForm | null = useMemo(() => {
    if (teacherId === '') return null;
    if (GROUP_TEACHERS.some((t) => t.id === teacherId)) return 'group';
    if (INDIVIDUAL_TEACHERS.some((t) => t.id === teacherId)) return 'individual';
    return null;
  }, [teacherId]);

  // Максимальный балл по форме педагога (для подписи «из скольки»).
  const maxScore = useMemo(
    () => (teacherForm ? maxTotalScore(teacherForm) : null),
    [teacherForm],
  );

  // Ориентировочная премия на следующий период по среднему баллу супервизии.
  const bonus = useMemo(() => {
    if (avg === null || !teacherForm) return null;
    const score = avg;

    // Пороги: минимальный балл уровня → премия за час и итоговая ставка.
    const tiers =
      teacherForm === 'group'
        ? [
            { min: 24, bonus: '100 ₽', total: '400 ₽/час' },
            { min: 29, bonus: '200 ₽', total: '500 ₽/час' },
            { min: 33, bonus: '350 ₽', total: '650 ₽/час' },
          ]
        : [
            { min: 30, bonus: '100 ₽', total: '400 ₽/час' },
            { min: 35, bonus: '200 ₽', total: '500 ₽/час' },
            { min: 41, bonus: '350 ₽', total: '650 ₽/час' },
          ];

    // Текущий уровень — последний, чей порог достигнут.
    let currentIdx = -1;
    for (let i = 0; i < tiers.length; i++) {
      if (score >= tiers[i].min) currentIdx = i;
    }
    const current =
      currentIdx >= 0 ? tiers[currentIdx] : { bonus: '0 ₽', total: '300 ₽/час' };

    // Следующий уровень (если есть, куда расти).
    const next = tiers[currentIdx + 1] ?? null;
    const nextHint = next
      ? {
          needed: Math.round((next.min - score) * 10) / 10,
          bonus: next.bonus,
          total: next.total,
        }
      : null;

    return { ...current, next: nextHint };
  }, [avg, teacherForm]);

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

  // Динамика: средний балл (в % от максимума) по каждой супервизии в хронологическом порядке.
  const dynamicData = useMemo(() => {
    return [...items]
      .filter((i) => i.supervision_date)
      .sort((a, b) => (a.supervision_date! < b.supervision_date! ? -1 : 1))
      .map((i) => {
        const max = maxTotalScore(i.lesson_form);
        return {
          date: fmtDate(i.supervision_date),
          score: i.total_score,
          max,
          form: i.lesson_form === 'group' ? 'Групповое' : 'Индивидуальное',
        };
      });
  }, [items]);

  const dynamicMax = useMemo(() => {
    const maxScore = dynamicData.reduce((m, d) => Math.max(m, d.score, d.max), 0);
    return Math.ceil(maxScore / 5) * 5;
  }, [dynamicData]);

  return (
    <div className="space-y-5">
      {/* Выбор педагога (скрыт в личном кабинете) */}
      {lockedTeacherId == null && (
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
      )}

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
                {avg !== null ? `${avg}${maxScore ? `/${maxScore}` : ''}` : '—'}
                <span className="text-sm font-normal text-gray-400"> · супервизий: {items.length}</span>
              </div>
            </div>
          </div>

          {bonus && (
            <div className="mt-3 flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-lg p-4">
              <div className="p-2 rounded-lg bg-emerald-100 flex-shrink-0">
                <Icon name="TrendingUp" size={18} className="text-emerald-600" />
              </div>
              <div className="text-sm text-gray-700">
                Ориентировочная премия по баллам супервизии на следующий период:{' '}
                <span className="font-semibold text-emerald-800">+{bonus.bonus}/час</span>{' '}
                <span className="text-gray-500">(ставка {bonus.total})</span>
                {bonus.next && (
                  <div className="mt-1.5 text-gray-600">
                    Чтобы получать{' '}
                    <span className="font-semibold text-emerald-700">+{bonus.next.bonus}/час</span>{' '}
                    (ставка {bonus.next.total}), нужно поднять средний балл на{' '}
                    <span className="font-semibold">{bonus.next.needed}</span>.
                  </div>
                )}
              </div>
            </div>
          )}

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

      {/* Моя динамика */}
      {teacherId !== '' && dynamicData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="TrendingUp" size={20} className="text-indigo-600" />
            <h3 className="text-base font-bold text-gray-900">Моя динамика</h3>
          </div>
          {dynamicData.length < 2 ? (
            <p className="text-sm text-gray-400">
              Для построения графика нужно минимум две супервизии за период.
            </p>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dynamicData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis
                    domain={[0, dynamicMax]}
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <Tooltip
                    formatter={(value: number, _name, props) => [
                      `${value} из ${props.payload.max} б.`,
                      props.payload.form,
                    ]}
                    labelStyle={{ color: '#111827', fontWeight: 600 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#4f46e5' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
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