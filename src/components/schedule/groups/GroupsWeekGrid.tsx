import {
  Customer,
  GroupsWeekResponse,
  MAX_GROUP_SIZE,
  WEEKDAY_SHORT,
  addDays,
  fmtDate,
  fmtRu,
  findAgeGroupRule,
} from '../types';
import { Booking, GroupLimit } from '@/lib/bookingsApi';
import { sameChild } from '@/lib/childName';
import GroupCard from './GroupCard';

interface Props {
  groupsData: GroupsWeekResponse;
  weekStart: Date;
  customers: Record<number, Customer>;
  groupBookings: Booking[];
  limitFor: (
    day: number,
    time: string,
    teacherId: number,
    groupId: number | null | undefined,
    date: string,
  ) => GroupLimit | null;
  ageFits: (day: number, time: string, teacherId: number) => boolean;
}

/** Таблица недели: 7 колонок по дням с карточками групп */
const GroupsWeekGrid = ({ groupsData, weekStart, customers, groupBookings, limitFor, ageFits }: Props) => (
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
          <div className="text-[10px] font-normal text-gray-400">{fmtRu(addDays(weekStart, i))}</div>
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
        const weekNames = groupsData.rows
          .flatMap((r) =>
            Object.values(r.cells).flatMap((c) => (c?.student_ids || []).map((id) => customers[id]?.name || '')),
          )
          .filter(Boolean);
        return (
          <div key={day} className={`border-gray-200 p-1.5 flex flex-col gap-1.5 ${day < 6 ? 'border-r' : ''}`}>
            {items.filter(({ row }) => ageFits(day, row.time, row.teacher_id)).length === 0 && (
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
              const ageRule = findAgeGroupRule(day, row.time, row.teacher_id);
              // Фильтр по возрасту скрывает карточку уже после разбора броней,
              // чтобы бронь не «переезжала» в соседнюю группу
              if (!ageFits(day, row.time, row.teacher_id)) return null;
              return (
                <GroupCard
                  key={`${row.time}-${row.teacher_id}-${row.group_id}`}
                  row={row}
                  cell={cell}
                  booked={booked}
                  limit={limit}
                  capacity={capacity}
                  isFull={isFull}
                  isDone={isDone}
                  ageRule={ageRule}
                  customers={customers}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  </div>
);

export default GroupsWeekGrid;
