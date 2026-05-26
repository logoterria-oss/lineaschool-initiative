import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const S20_URL = 'https://functions.poehali.dev/6d9e6094-fd18-47ec-b45f-ad3ee4ba7cc2';

// ── Индивидуальные ────────────────────────────────────────────────────────────

interface Slot {
  date: string;
  weekday: number;
  weekday_name: string;
  time_from: string;
  time_to: string;
  teacher_id: number;
  teacher_name: string;
}

interface DayGroup {
  weekday: number;
  weekday_name: string;
  slots: Slot[];
}

const TEACHER_SHORT: Record<number, string> = {
  2: 'Анастасия',
  18: 'Анна',
  11: 'Валерия',
  4: 'Дарья',
};

const TEACHER_COLOR: Record<number, string> = {
  2: 'bg-purple-100 text-purple-700 border-purple-200',
  18: 'bg-teal-100 text-teal-700 border-teal-200',
  11: 'bg-green-100 text-green-700 border-green-200',
  4: 'bg-orange-100 text-orange-700 border-orange-200',
};

// ── Группы ────────────────────────────────────────────────────────────────────

interface GroupCell {
  date: string;
  enrolled: number;
  free: number;
  lesson_id?: number;
}

interface GroupRow {
  time: string;
  teacher_id: number;
  teacher_name: string;
  cells: Record<string, GroupCell>;
  group_id?: number | null;
}

interface GroupsWeekResponse {
  max_size: number;
  date_from: string;
  date_to: string;
  rows: GroupRow[];
}

interface RawLesson {
  id: number;
  date: string;
  time_from: string;
  lesson_type_id: number;
  status: number;
  teacher_ids: number[];
  customer_ids?: number[];
  group_ids?: number[];
  details?: Array<{ customer_id?: number }>;
}

interface RawTeacher {
  id: number;
  name?: string;
}

const MAX_GROUP_SIZE = 6;

// Строим таблицу из сырого массива lessons на стороне фронта
const buildGroupRowsFromLessons = (
  lessons: RawLesson[],
  teachers: RawTeacher[],
  weekStart: Date,
): GroupRow[] => {
  const teacherShort: Record<number, string> = {};
  for (const t of teachers) {
    const full = (t.name || '').trim();
    const parts = full.split(/\s+/).filter(Boolean);
    if (parts.length === 0) teacherShort[t.id] = `#${t.id}`;
    else if (parts.length === 1) teacherShort[t.id] = parts[0];
    else teacherShort[t.id] = `${parts[0]} ${parts[1][0]}.`;
  }

  const weekStartTs = weekStart.getTime();
  const weekEndTs = addDays(weekStart, 6).getTime();

  const rows: Record<string, GroupRow> = {};
  for (const lesson of lessons) {
    if (lesson.lesson_type_id === 1) continue; // индивидуальные мимо
    const dateStr = (lesson.date || '').slice(0, 10);
    if (!dateStr) continue;
    const d = new Date(`${dateStr}T00:00:00`);
    const ts = d.getTime();
    if (ts < weekStartTs || ts >= weekEndTs) continue;

    let weekday = d.getDay() - 1; // JS: 0=Вс, нам нужно 0=Пн
    if (weekday < 0) weekday = 6;
    if (weekday > 5) continue; // воскресенье пропускаем

    let timeFrom = lesson.time_from || '';
    if (timeFrom.includes(' ')) timeFrom = timeFrom.split(' ').pop() || '';
    timeFrom = timeFrom.slice(0, 5);
    if (!timeFrom) continue;

    const tids = lesson.teacher_ids || [];
    if (!tids.length) continue;
    const teacherId = Number(tids[0]);

    const students = new Set<number>();
    for (const sid of lesson.customer_ids || []) students.add(sid);
    for (const det of lesson.details || []) {
      if (det && det.customer_id != null) students.add(det.customer_id);
    }
    const enrolled = students.size;

    const groupId =
      Array.isArray(lesson.group_ids) && lesson.group_ids.length
        ? lesson.group_ids[0]
        : null;

    const key = `${timeFrom}__${teacherId}`;
    if (!rows[key]) {
      rows[key] = {
        time: timeFrom,
        teacher_id: teacherId,
        teacher_name: teacherShort[teacherId] || `#${teacherId}`,
        cells: {},
        group_id: groupId,
      };
    }
    const prev = rows[key].cells[String(weekday)];
    if (!prev || enrolled > prev.enrolled) {
      rows[key].cells[String(weekday)] = {
        date: dateStr,
        enrolled,
        free: Math.max(0, MAX_GROUP_SIZE - enrolled),
        lesson_id: lesson.id,
      };
    }
  }

  return Object.values(rows).sort((a, b) => {
    if (a.time !== b.time) return a.time.localeCompare(b.time);
    return a.teacher_name.localeCompare(b.teacher_name);
  });
};

const WEEKDAY_SHORT = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];

const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
const getMonday = (d: Date) => {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
};
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const fmtRu = (d: Date) =>
  d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

// ─────────────────────────────────────────────────────────────────────────────

const SchedulePage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'individual' | 'groups' | 'online'>('individual');

  // Индивидуальные — свободные слоты
  const [days, setDays] = useState<DayGroup[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');

  // Группы (таблица по неделе)
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [groupsData, setGroupsData] = useState<GroupsWeekResponse | null>(null);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState('');

  const loadSlots = async () => {
    setSlotsLoading(true);
    setSlotsError('');
    try {
      const resp = await fetch(`${S20_URL}?mode=free_slots`);
      const data = await resp.json();
      const slots = data.slots_by_weekday;
      setDays(Array.isArray(slots) ? slots : []);
    } catch {
      setSlotsError('Не удалось загрузить свободные окна');
    } finally {
      setSlotsLoading(false);
    }
  };

  const loadGroups = async () => {
    setGroupsLoading(true);
    setGroupsError('');
    try {
      const df = fmtDate(weekStart);
      const dt = fmtDate(addDays(weekStart, 5));
      const resp = await fetch(`${S20_URL}?mode=lessons&date_from=${df}&date_to=${dt}`);
      const data = await resp.json();
      if (data.error) throw new Error(data.error);

      // Бэкенд возвращает {lessons:[...]} — собираем таблицу на фронте
      const lessons: RawLesson[] = Array.isArray(data.lessons) ? data.lessons : [];

      // Подтягиваем фамилии педагогов отдельным запросом (mode=teachers, если есть)
      let teachers: RawTeacher[] = [];
      try {
        const tresp = await fetch(`${S20_URL}?mode=teachers`);
        const tdata = await tresp.json();
        if (Array.isArray(tdata.teachers)) teachers = tdata.teachers;
        else if (Array.isArray(tdata.items)) teachers = tdata.items;
      } catch {
        // не критично — покажем teacher_id
      }

      const rows = buildGroupRowsFromLessons(lessons, teachers, weekStart);

      setGroupsData({
        max_size: MAX_GROUP_SIZE,
        date_from: df,
        date_to: dt,
        rows,
      });
    } catch {
      setGroupsError('Не удалось загрузить группы');
      setGroupsData(null);
    } finally {
      setGroupsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'individual') loadSlots();
    else loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, weekStart]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <AdminHeader showOnlyHome />
      <div className="container mx-auto px-4 py-8">
        <div className={tab === 'individual' ? 'max-w-4xl mx-auto' : 'max-w-7xl mx-auto'}>

          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate('/admin')} className="text-gray-500 hover:text-gray-800">
              <Icon name="ArrowLeft" size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Расписание (S20)</h1>
          </div>

          {/* Табы */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={tab === 'individual' ? 'default' : 'outline'}
              onClick={() => setTab('individual')}
              className="gap-2"
            >
              <Icon name="User" size={16} />
              Индивидуальные
            </Button>
            <Button
              variant={tab === 'groups' ? 'default' : 'outline'}
              onClick={() => setTab('groups')}
              className="gap-2"
            >
              <Icon name="Users" size={16} />
              Группы
            </Button>
            <Button
              variant={tab === 'online' ? 'default' : 'outline'}
              onClick={() => setTab('online')}
              className="gap-2"
            >
              <Icon name="Globe" size={16} />
              Онлайн-расписание
            </Button>
          </div>

          {/* ── Таб: Индивидуальные ── */}
          {tab === 'individual' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  Свободные окна по графику педагогов на ближайшие 4 недели
                </p>
                <Button variant="outline" size="sm" onClick={loadSlots} className="gap-1.5">
                  <Icon name="RefreshCw" size={14} />
                  Обновить
                </Button>
              </div>

              {slotsLoading && (
                <div className="text-center py-12 text-gray-500">
                  <Icon name="Loader2" size={32} className="animate-spin mx-auto mb-3" />
                  Загрузка из S20…
                </div>
              )}

              {slotsError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
                  {slotsError}
                </div>
              )}

              {!slotsLoading && !slotsError && days.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Icon name="CalendarOff" size={36} className="mx-auto mb-3" />
                  Свободных окон нет
                </div>
              )}

              {!slotsLoading && days.length > 0 && (
                <>
                  {/* Легенда */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {Object.entries(TEACHER_SHORT).map(([id, name]) => (
                      <span
                        key={id}
                        className={`text-xs font-medium px-3 py-1 rounded-full border ${TEACHER_COLOR[Number(id)]}`}
                      >
                        {name}
                      </span>
                    ))}
                  </div>

                  {/* Карточки по дням */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {days.map((day) => {
                      const byTime: Record<string, Slot[]> = {};
                      day.slots.forEach((s) => {
                        const key = `${s.time_from}–${s.time_to}`;
                        if (!byTime[key]) byTime[key] = [];
                        byTime[key].push(s);
                      });

                      return (
                        <div
                          key={day.weekday}
                          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                        >
                          <div className="bg-teal-600 px-4 py-2.5 flex items-center gap-2">
                            <Icon name="CalendarDays" size={15} className="text-teal-100" />
                            <span className="font-semibold text-white text-sm">{day.weekday_name}</span>
                            <span className="ml-auto text-teal-200 text-xs">
                              {Object.keys(byTime).length} окон
                            </span>
                          </div>
                          <div className="p-3 space-y-1.5">
                            {Object.entries(byTime)
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([timeKey, slots]) => (
                                <div
                                  key={timeKey}
                                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                                >
                                  <span className="font-mono font-semibold text-gray-800 text-sm">
                                    {timeKey}
                                  </span>
                                  <div className="flex flex-wrap gap-1 justify-end">
                                    {slots.map((s) => (
                                      <span
                                        key={s.teacher_id}
                                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TEACHER_COLOR[s.teacher_id] || 'bg-gray-100 text-gray-600 border-gray-200'}`}
                                      >
                                        {TEACHER_SHORT[s.teacher_id] || s.teacher_name.split(' ')[0]}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── Таб: Группы ── */}
          {tab === 'groups' && (
            <>
              {/* Навигация по неделе */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWeekStart(addDays(weekStart, -7))}
                    className="gap-1"
                  >
                    <Icon name="ChevronLeft" size={14} />
                    Неделя
                  </Button>
                  <div className="text-sm font-medium text-gray-700 px-2">
                    {fmtRu(weekStart)} — {fmtRu(addDays(weekStart, 5))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWeekStart(addDays(weekStart, 7))}
                    className="gap-1"
                  >
                    Неделя
                    <Icon name="ChevronRight" size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setWeekStart(getMonday(new Date()))}
                    className="text-xs"
                  >
                    Эта неделя
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={loadGroups} className="gap-1.5">
                  <Icon name="RefreshCw" size={14} />
                  Обновить
                </Button>
              </div>

              {groupsLoading && (
                <div className="text-center py-12 text-gray-500">
                  <Icon name="Loader2" size={32} className="animate-spin mx-auto mb-3" />
                  Загрузка из S20…
                </div>
              )}
              {groupsError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
                  {groupsError}
                </div>
              )}
              {!groupsLoading && !groupsError && groupsData && groupsData.rows.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Icon name="CalendarOff" size={36} className="mx-auto mb-3" />
                  На этой неделе нет групповых занятий
                </div>
              )}

              {!groupsLoading && !groupsError && groupsData && groupsData.rows.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                    <span>Цифра в ячейке = свободных мест из {groupsData.max_size}.</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-300" />
                      есть места
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded bg-red-100 border border-red-300" />
                      заполнено
                    </span>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                    <table className="w-full text-sm border-collapse min-w-[900px]">
                      <thead>
                        <tr className="bg-gray-50">
                          <th colSpan={3} className="border border-gray-200 px-3 py-2 font-medium text-gray-700">
                            I половина недели
                          </th>
                          <th colSpan={3} className="border border-gray-200 px-3 py-2 font-medium text-gray-700">
                            II половина недели
                          </th>
                        </tr>
                        <tr className="bg-gray-50">
                          {WEEKDAY_SHORT.map((wd, i) => (
                            <th
                              key={wd}
                              className="border border-gray-200 px-2 py-2 font-semibold text-gray-700 w-[16.66%]"
                            >
                              <div>{wd}</div>
                              <div className="text-[10px] font-normal text-gray-400">
                                {fmtRu(addDays(weekStart, i))}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {groupsData.rows.map((row, rIdx) => (
                          <tr key={`${row.time}-${row.teacher_id}-${rIdx}`}>
                            {WEEKDAY_SHORT.map((_, day) => {
                              const cell = row.cells[String(day)];
                              if (!cell) {
                                return (
                                  <td
                                    key={day}
                                    className="border border-gray-200 px-2 py-1.5 align-top h-12 text-gray-300 text-center"
                                  >
                                    —
                                  </td>
                                );
                              }
                              const isFull = cell.free === 0;
                              return (
                                <td
                                  key={day}
                                  className={`border border-gray-200 px-2 py-1.5 align-top ${
                                    isFull ? 'bg-red-50' : 'bg-green-50'
                                  }`}
                                >
                                  <div className="text-[11px] font-medium text-gray-600 mb-0.5">
                                    {row.time} ({row.teacher_name})
                                  </div>
                                  <div
                                    className={`text-lg font-bold text-center ${
                                      isFull ? 'text-red-600' : 'text-green-700'
                                    }`}
                                  >
                                    {cell.free}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── Таб: Онлайн-расписание (виджет S20) ── */}
          {tab === 'online' && (
            <>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <p className="text-sm text-gray-500">
                  Публичное расписание из AlfaCRM (S20) — то, что видят клиенты
                </p>
                <a
                  href="https://11086.s20.online/common/1/online-schedule/embed?data_pc=28ae61&data_locale=ru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-teal-600 hover:text-teal-700 inline-flex items-center gap-1.5"
                >
                  <Icon name="ExternalLink" size={14} />
                  Открыть в новой вкладке
                </a>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <iframe
                  title="Онлайн-расписание S20"
                  src="https://11086.s20.online/common/1/online-schedule/embed?data_pc=28ae61&data_locale=ru"
                  style={{ width: '100%', height: '80vh', border: 0 }}
                  loading="lazy"
                />
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default SchedulePage;