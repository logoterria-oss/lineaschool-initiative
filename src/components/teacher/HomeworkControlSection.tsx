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
  { id: 20, name: 'Канкулова Екатерина' },
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

const HomeworkControlSection = () => {
  const [teacher, setTeacher] = useState<{ id: number; name: string } | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  // --- Экран выбора педагога ---
  if (!teacher) {
    return (
      <div className="space-y-6">
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
