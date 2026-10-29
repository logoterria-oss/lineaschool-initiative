import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { moscowToday } from '@/lib/adminShiftsApi';
import { CHECKLIST } from '@/lib/shiftChecklist';
import ScheduleChecksCard from '@/components/adminShifts/ScheduleChecksCard';
import { useScheduleChecks } from '@/components/adminShifts/useScheduleChecks';
import DashSection from './DashSection';
import DashStub from './DashStub';
import ShiftTasksBlock from './ShiftTasksBlock';
import LeadsToContactBlock from './LeadsToContactBlock';
import { useDashMarks } from './useDashMarks';

const fmtDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  });

const SCHEDULE_ITEMS = CHECKLIST.filter((i) => i.auto);

const Counter = ({ n, tone = 'amber' }: { n: number; tone?: 'amber' | 'green' }) => (
  <span
    className={`text-xs font-medium rounded-full px-2 py-0.5 ${
      tone === 'green' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
    }`}
  >
    {n}
  </span>
);

/**
 * Дашборд администратора — общий для руководителей и админов.
 * Данные CRM сайт запрашивает сам раз в день, отметки видят все.
 */
const AdminDashboardView = () => {
  const date = moscowToday();
  const { marks, setMark } = useDashMarks(date);
  const schedule = useScheduleChecks(date, marks, setMark);
  const [shiftOpen, setShiftOpen] = useState(0);
  const [leadsCount, setLeadsCount] = useState(0);

  const doneItems = SCHEDULE_ITEMS.filter((i) => schedule.groupDone(i.auto!)).length;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-3 flex-wrap">
        <div>
          <div className="font-semibold text-gray-900 first-letter:uppercase">{fmtDate(date)}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            Отметки общие: их видят все руководители и администраторы
          </div>
        </div>
      </div>

      <DashSection
        num={1}
        title="Расписание и занятия"
        icon="CalendarCheck"
        color="bg-green-100 text-green-700"
        badge={
          schedule.checked && (
            <Counter n={doneItems} tone={doneItems === SCHEDULE_ITEMS.length ? 'green' : 'amber'} />
          )
        }
        actions={
          schedule.loading ? (
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <Icon name="Loader2" size={13} className="animate-spin" /> Загружаем данные дня…
            </span>
          ) : (
            schedule.checkedAt && (
              <span className="text-[11px] text-gray-400">
                Данные CRM на {schedule.checkedAt} · обновятся завтра утром
              </span>
            )
          )
        }
      >
        <div className="space-y-2">
          {SCHEDULE_ITEMS.map((i) => (
            <ScheduleChecksCard
              key={i.key}
              num={i.num}
              title={i.title}
              sections={schedule.sectionsFor(i.auto!)}
              yesterday={schedule.yesterday}
              loading={schedule.loading}
              failed={schedule.failed}
              checked={schedule.checked}
              allDone={schedule.groupDone(i.auto!)}
              marks={marks}
              onMark={setMark}
              reminders={schedule.reminders}
              onRemindersChange={schedule.reloadReminders}
              onRetryStudents={schedule.reloadStudents}
            />
          ))}
        </div>
      </DashSection>

      <DashSection
        num={2}
        title="Лиды, с которыми нужно связаться"
        icon="UserPlus"
        color="bg-blue-100 text-blue-700"
        badge={leadsCount > 0 && <Counter n={leadsCount} />}
      >
        <LeadsToContactBlock onCount={setLeadsCount} />
      </DashSection>

      <DashSection num={3} title="Каникуляры, с которыми нужно связаться" icon="Palmtree" color="bg-orange-100 text-orange-700">
        <DashStub text="Блок в настройке — скоро здесь появится список учеников на каникулах" />
      </DashSection>

      <DashSection num={4} title="Свободные окна: индивидуальные и групповые" icon="CalendarClock" color="bg-purple-100 text-purple-700">
        <DashStub text="Блок в настройке — скоро здесь появятся свободные окна" />
      </DashSection>

      <DashSection
        num={5}
        title="Задачи для админа на смене"
        icon="ClipboardList"
        color="bg-rose-100 text-rose-700"
        badge={shiftOpen > 0 && <Counter n={shiftOpen} />}
      >
        <ShiftTasksBlock onCount={setShiftOpen} />
      </DashSection>
    </div>
  );
};

export default AdminDashboardView;
