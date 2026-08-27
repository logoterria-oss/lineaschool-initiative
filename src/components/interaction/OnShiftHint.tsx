import Icon from '@/components/ui/icon';
import { OnShiftAdmin, shiftTime } from '@/lib/adminShiftsApi';

/** Короткое имя: «Иванова Мария Петровна» → «Иванова Мария» */
const shortName = (name: string) => (name || '').trim().split(/\s+/).slice(0, 2).join(' ');

/**
 * Строка «сейчас на смене» под кнопкой окна взаимодействия.
 * Показывает, кого окно считает дежурным прямо сейчас.
 */
const OnShiftHint = ({ admins, collapsed }: { admins: OnShiftAdmin[]; collapsed?: boolean }) => {
  if (collapsed) return null;

  if (admins.length === 0) {
    return (
      <p className="-mt-1 mb-1 text-[11px] text-gray-400 flex items-center gap-1.5 px-1">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
        Сейчас на смене никого нет
      </p>
    );
  }

  return (
    <div className="-mt-1 mb-1 px-1">
      <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
        На смене {admins.length}:
      </p>
      <ul className="mt-0.5 space-y-0.5">
        {admins.map((a) => (
          <li
            key={a.staff_id}
            className="text-[11px] text-gray-600 flex items-center gap-1 truncate"
            title={`${a.staff_name} · с ${shiftTime(a.started_at)}`}
          >
            <Icon name="UserCheck" size={11} className="text-green-500 flex-shrink-0" />
            <span className="truncate">{shortName(a.staff_name)}</span>
            <span className="text-gray-400 flex-shrink-0">с {shiftTime(a.started_at)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OnShiftHint;
