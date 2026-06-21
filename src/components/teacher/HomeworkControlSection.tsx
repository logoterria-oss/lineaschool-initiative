import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

const HW_URL = 'https://functions.poehali.dev/6d9e6094-fd18-47ec-b45f-ad3ee4ba7cc2';

const INDIVIDUAL_TEACHERS = [
  { id: 4, name: 'Еремина Дарья' },
  { id: 18, name: 'Карамова Анна' },
  { id: 11, name: 'Камнева Валерия' },
  { id: 2, name: 'Шишаева Анастасия' },
];

const GROUP_TEACHERS = [
  { id: 17, name: 'Канкулова Екатерина' },
  { id: 15, name: 'Мацвей Екатерина' },
];

type HwStatus = '' | 'green' | 'yellow' | 'red';

interface LessonCell {
  date: string;
  is_future: boolean;
  status: HwStatus;
}

interface Student {
  id: number;
  name: string;
  lessons: LessonCell[];
}

// Цикл переключения цвета по клику
const NEXT_STATUS: Record<HwStatus, HwStatus> = {
  '': 'green',
  green: 'yellow',
  yellow: 'red',
  red: '',
};

const STATUS_STYLE: Record<HwStatus, string> = {
  '': 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50',
  green: 'bg-green-500 border-green-500 text-white',
  yellow: 'bg-yellow-400 border-yellow-400 text-gray-900',
  red: 'bg-red-500 border-red-500 text-white',
};

const fmtDate = (iso: string) => {
  const [, m, d] = iso.split('-');
  return `${d}.${m}`;
};

const MONTH_NAMES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const monthKey = (iso: string) => iso.slice(0, 7); // YYYY-MM
const monthLabel = (key: string) => {
  const [y, m] = key.split('-');
  return `${MONTH_NAMES[Number(m) - 1]} ${y}`;
};

interface SummaryStudent extends Student {
  teacher_id: number;
  teacher_name: string;
}

const HomeworkControlSection = () => {
  const [teacher, setTeacher] = useState<{ id: number; name: string } | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<SummaryStudent[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const openSummary = () => {
    setShowSummary(true);
    setSummaryLoading(true);
    setSummaryError('');
    fetch(`${HW_URL}?mode=hw_all`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setSummaryError('Не удалось загрузить сводную таблицу. Попробуйте позже.');
        else setSummary(data.students || []);
      })
      .catch(() => setSummaryError('Ошибка соединения.'))
      .finally(() => setSummaryLoading(false));
  };

  useEffect(() => {
    if (!teacher) return;
    setLoading(true);
    setError('');
    fetch(`${HW_URL}?mode=hw&teacher_id=${teacher.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError('Не удалось загрузить данные. Попробуйте позже.');
        else setStudents(data.students || []);
      })
      .catch(() => setError('Ошибка соединения.'))
      .finally(() => setLoading(false));
  }, [teacher]);

  const cycleStatus = async (student: Student, cell: LessonCell) => {
    const next = NEXT_STATUS[cell.status];
    // оптимистично обновляем
    setStudents((prev) =>
      prev.map((s) =>
        s.id === student.id
          ? { ...s, lessons: s.lessons.map((l) => (l.date === cell.date ? { ...l, status: next } : l)) }
          : s,
      ),
    );
    try {
      await fetch(HW_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacher!.id,
          student_id: student.id,
          student_name: student.name,
          lesson_date: cell.date,
          status: next,
        }),
      });
    } catch {
      setError('Не удалось сохранить. Проверьте интернет.');
    }
  };

  // --- Сводная таблица по всем педагогам ---
  if (showSummary) {
    // Собираем все месяцы, встречающиеся в данных
    const monthsSet = new Set<string>();
    summary.forEach((s) => s.lessons.forEach((l) => monthsSet.add(monthKey(l.date))));
    const months = Array.from(monthsSet).sort();

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowSummary(false)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <Icon name="ArrowLeft" size={16} />
            Назад
          </button>
          <span className="font-semibold text-gray-900">Сводная таблица</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-green-500 inline-block" /> Хорошо</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-yellow-400 inline-block" /> Плохо</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-red-500 inline-block" /> Не выполнено</span>
        </div>

        {summaryLoading && <div className="text-gray-500 py-12 text-center">Собираем данные по всем педагогам…</div>}
        {summaryError && !summaryLoading && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{summaryError}</p>
        )}

        {!summaryLoading && !summaryError && summary.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Icon name="Inbox" size={36} className="mx-auto mb-3" />
            <p>Нет данных</p>
          </div>
        )}

        {!summaryLoading && summary.length > 0 && months.map((mk) => (
          <div key={mk} className="mb-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Icon name="Calendar" size={16} className="text-green-600" />
              {monthLabel(mk)}
            </h3>
            <div className="space-y-2">
              {summary
                .filter((s) => s.lessons.some((l) => monthKey(l.date) === mk))
                .map((s) => (
                  <div key={`${s.teacher_id}-${s.id}`} className="bg-white rounded-xl border border-gray-200 p-3">
                    <div className="flex flex-wrap items-baseline gap-x-2 mb-2">
                      <span className="font-semibold text-gray-900 text-sm">{s.name}</span>
                      <span className="text-xs text-gray-400">· {s.teacher_name}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {s.lessons
                        .filter((l) => monthKey(l.date) === mk)
                        .map((l) => (
                          <span
                            key={l.date}
                            className={`min-w-[52px] text-center px-2 py-1 rounded-md border text-xs font-medium font-mono ${STATUS_STYLE[l.status]} ${l.is_future && l.status === '' ? 'opacity-50' : ''}`}
                          >
                            {fmtDate(l.date)}
                          </span>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // --- Экран выбора педагога ---
  if (!teacher) {
    return (
      <div className="space-y-6">
        <button
          onClick={openSummary}
          className="w-full flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white rounded-xl p-4 font-semibold transition-colors shadow-sm"
        >
          <Icon name="Table" size={20} />
          Составить сводную таблицу
        </button>

        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Индивидуальные занятия
          </h3>
          <div className="grid gap-2">
            {INDIVIDUAL_TEACHERS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTeacher(t)}
                className="w-full flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-blue-400 hover:shadow-sm transition-all"
              >
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Icon name="User" size={18} className="text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">{t.name}</span>
                <Icon name="ChevronRight" size={18} className="text-gray-400 ml-auto" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Групповые занятия
          </h3>
          <div className="grid gap-2">
            {GROUP_TEACHERS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTeacher(t)}
                className="w-full flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-purple-400 hover:shadow-sm transition-all"
              >
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Icon name="Users" size={18} className="text-purple-600" />
                </div>
                <span className="font-medium text-gray-900">{t.name}</span>
                <Icon name="ChevronRight" size={18} className="text-gray-400 ml-auto" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- Таблица контроля ДЗ ---
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => { setTeacher(null); setStudents([]); }}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <Icon name="ArrowLeft" size={16} />
          Выбрать другого педагога
        </button>
        <span className="font-semibold text-gray-900">{teacher.name}</span>
      </div>

      {/* Легенда */}
      <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-gray-600">
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-green-500 inline-block" /> Выполнено хорошо</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-yellow-400 inline-block" /> Выполнено плохо</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-red-500 inline-block" /> Не выполнено</span>
        <span className="text-gray-400">· кликайте по дате, чтобы менять цвет</span>
      </div>

      {loading && <div className="text-gray-500 py-12 text-center">Загрузка…</div>}
      {error && !loading && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3 mb-4">{error}</p>
      )}

      {!loading && !error && students.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Icon name="Inbox" size={36} className="mx-auto mb-3" />
          <p>Нет уроков с 1 июня</p>
        </div>
      )}

      {!loading && students.length > 0 && (
        <div className="space-y-3">
          {students.map((s, i) => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-gray-400 text-sm w-5 flex-shrink-0">{i + 1}.</span>
                <span className="font-semibold text-gray-900">{s.name}</span>
              </div>
              <div className="flex flex-wrap gap-2 pl-7">
                {s.lessons.map((cell) => (
                  <button
                    key={cell.date}
                    onClick={() => cycleStatus(s, cell)}
                    title={cell.is_future ? 'Будущий урок' : 'Проведённый урок'}
                    className={`min-w-[58px] px-2 py-1.5 rounded-lg border text-sm font-medium font-mono transition-colors ${STATUS_STYLE[cell.status]} ${cell.is_future && cell.status === '' ? 'opacity-50' : ''}`}
                  >
                    {fmtDate(cell.date)}
                  </button>
                ))}
                {s.lessons.length === 0 && (
                  <span className="text-xs text-gray-400 italic">Нет уроков</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomeworkControlSection;