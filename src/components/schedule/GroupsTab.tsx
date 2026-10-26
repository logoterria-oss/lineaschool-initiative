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
  formatStudentName,
} from './types';
import { Booking, GroupLimit, bookingHoldsSlot, fetchBookings, fetchGroupLimits } from '@/lib/bookingsApi';
import GroupLimitsDialog from './GroupLimitsDialog';
import { sameChild } from '@/lib/childName';

const GroupsTab = () => {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [groupsData, setGroupsData] = useState<GroupsWeekResponse | null>(null);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState('');
  const [groupsAutoJumped, setGroupsAutoJumped] = useState(false);
  const [customers, setCustomers] = useState<Record<number, Customer>>({});
  const [groupBookings, setGroupBookings] = useState<Booking[]>([]);
  const [limits, setLimits] = useState<GroupLimit[]>([]);
  const [limitsOpen, setLimitsOpen] = useState(false);

  const loadLimits = async () => setLimits(await fetchGroupLimits());

  // Временный потолок группы на дату занятия (null — ограничения нет)
  const limitFor = (day: number, time: string, teacherId: number, groupId: number | null | undefined, date: string) =>
    limits.find(
      (l) =>
        l.weekday === day &&
        l.timeFrom === time &&
        l.teacherId === teacherId &&
        (l.groupId == null || l.groupId === groupId) &&
        l.dateFrom <= date &&
        date <= l.dateTo,
    ) || null;

  const loadGroups = async (autoJump = false) => {
    setGroupsLoading(true);
    setGroupsError('');
    try {
      let df = fmtDate(weekStart);
      let dt = fmtDate(addDays(weekStart, 6));

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

  // Брони: детей ещё нет в CRM, но места они уже занимают
  const loadGroupBookings = async () => {
    try {
      const { bookings } = await fetchBookings('all', true);
      const flat: Booking[] = [];
      for (const b of bookings) {
        for (const l of b.lessons?.length ? b.lessons : [b]) {
          const active = bookingHoldsSlot({ status: b.status, date: l.date });
          // inCrm — ребёнка уже завели в группу, он и так есть в списке
          if (l.lessonType === 'groups' && active && !l.inCrm) {
            flat.push({ ...l, childName: l.childName || b.childName });
          }
        }
      }
      setGroupBookings(flat);
    } catch {
      // не критично — покажем только состав из CRM
    }
  };

  useEffect(() => {
    loadCustomers();
    loadGroupBookings();
    loadLimits();
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
            {fmtRu(weekStart)} — {fmtRu(addDays(weekStart, 6))}
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLimitsOpen(true)}
            disabled={!groupsData?.rows.length}
            className="gap-1.5"
          >
            <Icon name="SlidersHorizontal" size={14} />
            Ограничить количество слотов
            {limits.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gray-200 text-gray-700 text-[11px] font-bold">
                {limits.length}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadGroups();
              loadLimits();
            }}
            className="gap-1.5"
          >
            <Icon name="RefreshCw" size={14} />
            Обновить
          </Button>
        </div>
      </div>

      <GroupLimitsDialog
        open={limitsOpen}
        onClose={() => setLimitsOpen(false)}
        rows={groupsData?.rows || []}
        limits={limits}
        onChanged={loadLimits}
      />

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
            <span>В ячейке — список учеников (до {groupsData.max_size}).</span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-green-50 border border-green-300" />
              есть места
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-red-50 border border-red-300" />
              заполнено
            </span>
            <span className="inline-flex items-center gap-1 text-amber-700">
              <span className="inline-block rounded bg-amber-100 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                бронь
              </span>
              ученика ещё нет в CRM
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-500 text-white">
                <Icon name="Check" size={9} />
              </span>
              проведено
            </span>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <div className="grid grid-cols-7 min-w-[1280px]">
              {/* Шапка: I и II половина недели */}
              <div className="col-span-4 bg-gray-50 border-b border-r border-gray-200 px-3 py-2 text-center font-medium text-gray-700 text-sm">
                I половина недели
              </div>
              <div className="col-span-3 bg-gray-50 border-b border-gray-200 px-3 py-2 text-center font-medium text-gray-700 text-sm">
                II половина недели
              </div>
              {/* Шапка: дни недели + даты */}
              {WEEKDAY_SHORT.map((wd, i) => (
                <div
                  key={wd}
                  className={`bg-gray-50 border-b border-gray-200 px-2 py-2 text-center font-semibold text-gray-700 text-sm ${
                    i < 6 ? 'border-r' : ''
                  }`}
                >
                  <div>{wd}</div>
                  <div className="text-[10px] font-normal text-gray-400">
                    {fmtRu(addDays(weekStart, i))}
                  </div>
                </div>
              ))}
              {/* Колонки занятий */}
              {WEEKDAY_SHORT.map((_, day) => {
                // собрать все занятия этого дня недели из всех row, отсортировать по времени
                const items = groupsData.rows
                  .map((row) => ({ row, cell: row.cells[String(day)] }))
                  .filter((x) => !!x.cell)
                  .sort((a, b) => a.row.time.localeCompare(b.row.time));

                // Бронь показываем один раз: если у педагога в это время две
                // группы, она уходит в первую из них
                const usedBookings = new Set<number>();
                const weekNames = groupsData.rows.flatMap((r) =>
                  Object.values(r.cells).flatMap((c) => (c?.student_ids || []).map((id) => customers[id]?.name || '')),
                ).filter(Boolean);
                return (
                  <div
                    key={day}
                    className={`border-gray-200 p-1.5 flex flex-col gap-1.5 ${
                      day < 6 ? 'border-r' : ''
                    }`}
                  >
                    {items.length === 0 && (
                      <div className="text-[11px] text-gray-300 text-center py-4">—</div>
                    )}
                    {items.map(({ row, cell }) => {
                      if (!cell) return null;
                      // Брони этой группы: ребёнка в CRM ещё нет, но место занято.
                      // Список уже очищен от тех, кого завели в CRM.
                      const booked = groupBookings.filter((b) => {
                        if (usedBookings.has(b.id)) return false;
                        // Ребёнок уже стоит в расписании этой недели — бронь не дублируем
                        if (weekNames.some((nm) => sameChild(b.childName, nm))) return false;
                        // Бронь на будущую дату не занимает место в более ранних неделях
                        const mine =
                          (b.date || '') <= fmtDate(addDays(weekStart, 6)) &&
                          b.timeFrom.slice(0, 5) === row.time &&
                          Number(b.teacherId) === row.teacher_id &&
                          new Date(`${b.date}T00:00:00`).getDay() === (day + 1) % 7;
                        if (mine) usedBookings.add(b.id);
                        return mine;
                      });
                      const limit = limitFor(day, row.time, row.teacher_id, row.group_id, cell.date);
                      const capacity = limit ? Math.min(MAX_GROUP_SIZE, limit.maxSize) : MAX_GROUP_SIZE;
                      const isFull = capacity - cell.student_ids.length - booked.length <= 0;
                      const isDone = cell.status === 3;
                      return (
                        <div
                          key={`${row.time}-${row.teacher_id}-${row.group_id}`}
                          className={`rounded border text-[12px] overflow-hidden ${
                            isFull ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                          }`}
                        >
                          <div className="relative text-center text-[11px] font-semibold text-gray-700 bg-amber-50 px-2 py-1 border-b border-gray-200">
                            {row.time} ({row.teacher_name})
                            {isDone && (
                              <span
                                className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white"
                                title="Занятие проведено"
                              >
                                <Icon name="Check" size={10} />
                              </span>
                            )}
                          </div>
                          <ol className="space-y-0.5 px-2 py-1.5">
                            {Array.from({
                              length: Math.max(
                                MAX_GROUP_SIZE,
                                cell.student_ids.length + booked.length,
                              ),
                            }).map((_, i) => {
                              const sid = cell.student_ids[i];
                              const overflow = i >= MAX_GROUP_SIZE;
                              const numNode = overflow ? (
                                <span
                                  className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-semibold mr-1 align-middle"
                                  title="Сверх лимита группы"
                                >
                                  {i + 1}
                                </span>
                              ) : (
                                <>{i + 1}. </>
                              );
                              if (sid == null) {
                                // Свободные строки занимаем бронями — они идут
                                // сразу после учеников из CRM
                                const bk = booked[i - cell.student_ids.length];
                                if (bk) {
                                  return (
                                    <li key={i} className="text-amber-700">
                                      {numNode}
                                      {formatStudentName(bk.childName) || bk.childName}
                                      <span
                                        className="ml-1 inline-block rounded bg-amber-100 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-amber-700 align-middle"
                                        title="Бронь: ученика ещё нет в CRM"
                                      >
                                        бронь
                                      </span>
                                    </li>
                                  );
                                }
                                if (i >= capacity && i < MAX_GROUP_SIZE) {
                                  return (
                                    <li
                                      key={i}
                                      className="text-gray-400"
                                      title={`Место закрыто до ${limit?.dateTo.split('-').reverse().join('.')}`}
                                    >
                                      {numNode}
                                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                        <Icon name="Lock" size={10} />
                                        закрыто
                                      </span>
                                    </li>
                                  );
                                }
                                return (
                                  <li key={i} className="text-gray-400">
                                    {numNode}
                                  </li>
                                );
                              }
                              const c = customers[sid];
                              const name = formatStudentName(c?.name) || `id ${sid}`;
                              const isLead = c?.is_study === 0;
                              return (
                                <li
                                  key={i}
                                  className={isLead ? 'text-green-600' : 'text-gray-800'}
                                  title={isLead ? 'Лид' : undefined}
                                >
                                  {numNode}
                                  {name}
                                </li>
                              );
                            })}
                          </ol>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default GroupsTab;