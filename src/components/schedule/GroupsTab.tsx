import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  S20_URL,
  GroupsWeekResponse,
  RawLesson,
  RawTeacher,
  Customer,
  MAX_GROUP_SIZE,
  WEEKDAY_SHORT,
  fmtDate,
  getMonday,
  addDays,
  fmtRu,
  buildGroupRowsFromLessons,
  calcAge,
  formatStudentName,
} from './types';

const GroupsTab = () => {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [groupsData, setGroupsData] = useState<GroupsWeekResponse | null>(null);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState('');
  const [groupsAutoJumped, setGroupsAutoJumped] = useState(false);
  const [customers, setCustomers] = useState<Record<number, Customer>>({});

  const loadGroups = async (autoJump = false) => {
    setGroupsLoading(true);
    setGroupsError('');
    try {
      let df = fmtDate(weekStart);
      let dt = fmtDate(addDays(weekStart, 5));

      // первое открытие — спросим у бэкенда ближайшую неделю с групповыми уроками
      if (autoJump) {
        try {
          const nresp = await fetch(`${S20_URL}?mode=next_group_week&date_from=${df}`);
          const ndata = await nresp.json();
          if (ndata?.date_from && ndata?.date_to) {
            df = ndata.date_from;
            dt = ndata.date_to;
            const newMonday = new Date(`${df}T00:00:00`);
            if (newMonday.getTime() !== weekStart.getTime()) {
              setWeekStart(newMonday);
              setGroupsLoading(false);
              return; // useEffect перезапустит loadGroups уже без autoJump
            }
          }
        } catch {
          // не критично — продолжим с текущей недели
        }
      }

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

  const loadCustomers = async () => {
    try {
      const resp = await fetch(`${S20_URL}?mode=customers`);
      const data = await resp.json();
      const items: Customer[] = Array.isArray(data.customers) ? data.customers : [];
      const map: Record<number, Customer> = {};
      for (const c of items) {
        if (c && c.id != null) map[c.id] = c;
      }
      setCustomers(map);
    } catch {
      // не критично — покажем id вместо имён
    }
  };

  useEffect(() => {
    // при первом открытии вкладки «Группы» — ищем ближайшую неделю с уроками
    const needAutoJump = !groupsAutoJumped;
    if (needAutoJump) setGroupsAutoJumped(true);
    loadGroups(needAutoJump);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  useEffect(() => {
    loadCustomers();
  }, []);

  return (
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
        <Button variant="outline" size="sm" onClick={() => loadGroups()} className="gap-1.5">
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
          <div className="flex items-center gap-2 mb-2 text-xs text-gray-500 flex-wrap">
            <span>В ячейке — список учеников (до {groupsData.max_size}). В скобках возраст.</span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-green-50 border border-green-300" />
              есть места
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-red-50 border border-red-300" />
              заполнено
            </span>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[1100px]">
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
                        // Пустая ячейка — но всё равно с нумерацией 1..6 (как на образце)
                        return (
                          <td
                            key={day}
                            className="border border-gray-200 px-2 py-1.5 align-top text-[12px] text-gray-300"
                          >
                            <ol className="space-y-0.5">
                              {Array.from({ length: MAX_GROUP_SIZE }).map((_, i) => (
                                <li key={i}>{i + 1}.</li>
                              ))}
                            </ol>
                          </td>
                        );
                      }
                      const isFull = cell.free === 0;
                      return (
                        <td
                          key={day}
                          className={`border border-gray-200 px-2 py-1.5 align-top text-[12px] ${
                            isFull ? 'bg-red-50' : 'bg-green-50'
                          }`}
                        >
                          <div className="text-center text-[11px] font-semibold text-gray-700 mb-1 bg-amber-50 -mx-2 -mt-1.5 px-2 py-1 border-b border-gray-200">
                            {row.time} ({row.teacher_name})
                          </div>
                          <ol className="space-y-0.5">
                            {Array.from({ length: MAX_GROUP_SIZE }).map((_, i) => {
                              const sid = cell.student_ids[i];
                              if (sid == null) {
                                return (
                                  <li key={i} className="text-gray-400">
                                    {i + 1}.
                                  </li>
                                );
                              }
                              const c = customers[sid];
                              const name = formatStudentName(c?.name) || `id ${sid}`;
                              const age = calcAge(c?.b_date);
                              return (
                                <li key={i} className="text-gray-800">
                                  {i + 1}. {name}
                                  {age != null && (
                                    <span className="text-gray-500"> ({age})</span>
                                  )}
                                </li>
                              );
                            })}
                          </ol>
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
  );
};

export default GroupsTab;
