import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import {
  Supervision,
  fetchSupervisions,
} from '@/lib/supervisionsApi';
import { GROUP_TEACHERS, INDIVIDUAL_TEACHERS, maxTotalScore } from '@/lib/supervisionChecklist';

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

const TeacherSupervisions = () => {
  const now = new Date();
  const [teacherId, setTeacherId] = useState<number | ''>('');
  const [mode, setMode] = useState<Mode>('quarter');
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);
  const [fromMonth, setFromMonth] = useState(0);
  const [toMonth, setToMonth] = useState(now.getMonth());

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
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex items-center gap-4">
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
            <div
              key={s.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-start justify-between gap-3"
            >
              <div>
                <div className="font-medium text-gray-900">{fmtDate(s.supervision_date)}</div>
                <div className="text-sm text-gray-500">
                  {s.lesson_form === 'group' ? 'Групповое' : 'Индивидуальное'}
                  {s.lesson_date ? ` · урок ${fmtDate(s.lesson_date)}` : ''}
                </div>
                {s.student_name && (
                  <div className="text-sm text-gray-600">
                    Ученик: {s.student_name}
                    {s.student_age != null ? ` (${s.student_age})` : ''}
                  </div>
                )}
                {s.reviewer_comment && (
                  <div className="text-sm text-gray-600 mt-1">{s.reviewer_comment}</div>
                )}
              </div>
              <div className="text-right font-semibold text-indigo-700 flex-shrink-0">
                {s.total_score}
                <span className="text-gray-400 font-normal text-xs"> / {maxTotalScore(s.lesson_form)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherSupervisions;