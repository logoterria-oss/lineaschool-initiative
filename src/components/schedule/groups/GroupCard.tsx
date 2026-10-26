import Icon from '@/components/ui/icon';
import {
  AgeGroupRule,
  Customer,
  GroupCell,
  GroupRow,
  MAX_GROUP_SIZE,
  calcAge,
  formatStudentName,
  manualAge,
  shouldForceManualAge,
} from '../types';
import { Booking, GroupLimit } from '@/lib/bookingsApi';

interface Props {
  row: GroupRow;
  cell: GroupCell;
  booked: Booking[];
  limit: GroupLimit | null;
  capacity: number;
  isFull: boolean;
  isDone: boolean;
  ageRule: AgeGroupRule | null;
  customers: Record<number, Customer>;
}

/** Карточка одной группы: время, педагог, возраст и список учеников с бронями */
const GroupCard = ({ row, cell, booked, limit, capacity, isFull, isDone, ageRule, customers }: Props) => (
  <div
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
    {ageRule && (
      <div className="flex items-center justify-center gap-1 bg-indigo-50 border-b border-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
        <Icon name="Users" size={10} />
        {ageRule.label}
      </div>
    )}
    <ol className="space-y-0.5 px-2 py-1.5">
      {Array.from({
        length: Math.max(MAX_GROUP_SIZE, cell.student_ids.length + booked.length),
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
        const rawAge = calcAge(c?.dob);
        const age = shouldForceManualAge(name) ? manualAge(name) : rawAge ?? manualAge(name);
        const isLead = c?.is_study === 0;
        return (
          <li key={i} className={isLead ? 'text-green-600' : 'text-gray-800'} title={isLead ? 'Лид' : undefined}>
            {numNode}
            {name}
            {age != null && (
              <span className={isLead ? 'text-green-500' : 'text-gray-500'}>
                {' '}
                ({age})
              </span>
            )}
          </li>
        );
      })}
    </ol>
  </div>
);

export default GroupCard;
