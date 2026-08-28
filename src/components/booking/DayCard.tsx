import Icon from '@/components/ui/icon';
import { FreeDay, GroupDay, GroupSlot, SlotTeacher } from '@/lib/bookingsApi';

export interface Choice {
  date: string;
  dateRu: string;
  weekdayName: string;
  timeFrom: string;
  timeTo: string;
  teacherId: number;
  teacherName: string;
  availableFrom?: string | null;
  free?: number;
  maxSize?: number;
}

const fmtRu = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};

const sameChoice = (a: Choice | null, b: Choice) =>
  !!a && a.date === b.date && a.timeFrom === b.timeFrom && a.teacherId === b.teacherId;

const FromDate = ({ iso, light }: { iso?: string | null; light?: boolean }) =>
  iso ? (
    <div className={`text-[11px] font-medium ${light ? 'text-amber-100' : 'text-amber-600'}`}>
      с {fmtRu(iso)}
    </div>
  ) : null;

interface IndividualDayProps {
  day: FreeDay;
  selected: Choice | null;
  onSelect: (choice: Choice) => void;
}

/** День недели с индивидуальными окнами: время → свободные педагоги */
export const IndividualDay = ({ day, selected, onSelect }: IndividualDayProps) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <div className="font-semibold text-gray-800 mb-3">
      {day.weekdayName}
      <span className="text-gray-400 font-normal ml-2 text-sm">c {day.dateRu}</span>
    </div>
    <div className="space-y-2">
      {day.slots.map((slot) => (
        <div key={slot.timeFrom} className="flex items-start gap-2 flex-wrap">
          <div className="text-sm font-semibold text-gray-700 w-[104px] pt-2 shrink-0">
            {slot.timeFrom}–{slot.timeTo}
          </div>
          <div className="flex flex-wrap gap-2">
            {slot.teachers.map((t: SlotTeacher) => {
              const choice: Choice = {
                date: day.date,
                dateRu: day.dateRu,
                weekdayName: day.weekdayName,
                timeFrom: slot.timeFrom,
                timeTo: slot.timeTo,
                teacherId: t.teacherId,
                teacherName: t.teacherName,
                availableFrom: t.availableFrom,
              };
              const active = sameChoice(selected, choice);
              return (
                <button
                  key={t.teacherId}
                  type="button"
                  onClick={() => onSelect(choice)}
                  className={`rounded-lg border px-3 py-2 text-left transition ${
                    active
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white border-gray-200 hover:border-emerald-400'
                  }`}
                >
                  <div className="text-sm">{t.teacherName}</div>
                  <FromDate iso={t.availableFrom} light={active} />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  </div>
);

interface GroupDayProps {
  day: GroupDay;
  selected: Choice | null;
  onSelect: (choice: Choice) => void;
}

/** День недели с групповыми занятиями: время, педагог и свободные места */
export const GroupDayCard = ({ day, selected, onSelect }: GroupDayProps) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <div className="font-semibold text-gray-800 mb-3">
      {day.weekdayName}
      <span className="text-gray-400 font-normal ml-2 text-sm">c {day.dateRu}</span>
    </div>
    <div className="flex flex-wrap gap-2">
      {day.groups.map((g: GroupSlot) => {
        const choice: Choice = {
          date: day.date,
          dateRu: day.dateRu,
          weekdayName: day.weekdayName,
          timeFrom: g.timeFrom,
          timeTo: g.timeTo,
          teacherId: g.teacherId,
          teacherName: g.teacherName,
          availableFrom: g.availableFrom,
          free: g.free,
          maxSize: g.maxSize,
        };
        const active = sameChoice(selected, choice);
        return (
          <button
            key={`${g.timeFrom}-${g.teacherId}`}
            type="button"
            onClick={() => onSelect(choice)}
            className={`rounded-lg border px-3 py-2 text-left transition ${
              active
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'bg-white border-gray-200 hover:border-emerald-400'
            }`}
          >
            <div className="text-sm font-semibold">
              {g.timeFrom}–{g.timeTo}
            </div>
            <div className={`text-[11px] ${active ? 'text-emerald-50' : 'text-gray-500'}`}>
              {g.teacherName}
            </div>
            <div
              className={`text-[11px] flex items-center gap-1 ${
                active ? 'text-emerald-50' : 'text-emerald-700'
              }`}
            >
              <Icon name="Users" size={11} />
              свободно {g.free} из {g.maxSize}
            </div>
            <FromDate iso={g.availableFrom} light={active} />
          </button>
        );
      })}
    </div>
  </div>
);
