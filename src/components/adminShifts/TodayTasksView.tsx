import Icon from '@/components/ui/icon';
import { BLOCK_TITLES, ChecklistBlock } from '@/lib/shiftChecklist';
import ChecklistRow from './ChecklistRow';
import ScheduleChecksCard from './ScheduleChecksCard';
import { useScheduleChecks } from './useScheduleChecks';
import { useShiftChecklist } from './useShiftChecklist';

const BLOCK_ICONS: Record<ChecklistBlock, string> = {
  morning: 'Sunrise',
  day: 'Sun',
  evening: 'Sunset',
  weekly: 'CalendarDays',
};

const fmtDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  });

/** Чек-лист администратора на сегодня: галочки, комментарии и задачи руководителя */
const TodayTasksView = () => {
  const { date, blocks, marks, headTasks, handledBefore, loading, doneCount, total, setMark } =
    useShiftChecklist();
  const schedule = useScheduleChecks(date, marks, setMark, handledBefore);

  if (loading) return <div className="text-sm text-gray-400">Загружаем чек-лист…</div>;

  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <div className="font-semibold text-gray-900 first-letter:uppercase">
              {fmtDate(date)}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Выполнено {doneCount} из {total}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Одна кнопка на весь чек-лист: запросы в CRM тяжёлые,
                поэтому ходим туда только по нажатию и сразу по всем пунктам */}
            <button
              onClick={schedule.reload}
              disabled={schedule.loading}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              title="Запросить данные из AlfaCRM"
            >
              <Icon
                name="RefreshCw"
                size={14}
                className={schedule.loading ? 'animate-spin' : ''}
              />
              {schedule.loading
                ? 'Смотрим CRM…'
                : schedule.checked
                  ? 'Проверить заново'
                  : 'Проверить в CRM'}
            </button>
            <div className="text-2xl font-bold text-green-600">{progress}%</div>
          </div>
        </div>
        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {headTasks.length > 0 && (
        <section className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Icon name="ClipboardList" size={16} className="text-amber-500" />
            Задания руководителя
          </h3>
          <div className="space-y-2">
            {headTasks.map((t) => {
              const key = `head-${t.id}`;
              const m = marks[key] || { done: false, comment: '' };
              return (
                <ChecklistRow
                  key={key}
                  num={null}
                  title={t.title}
                  place=""
                  fromHead
                  done={m.done}
                  comment={m.comment}
                  onChange={(p) => setMark(key, p)}
                />
              );
            })}
          </div>
        </section>
      )}

      {blocks.map(([block, items]) => (
        <section key={block} className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Icon name={BLOCK_ICONS[block] as 'Sun'} size={16} className="text-gray-400" />
            {BLOCK_TITLES[block]}
          </h3>
          <div className="space-y-2">
            {items.map((i) => {
              const m = marks[i.key] || { done: false, comment: '' };
              if (i.auto) {
                return (
                  <ScheduleChecksCard
                    key={i.key}
                    num={i.num}
                    title={i.title}
                    sections={schedule.sectionsFor(i.auto)}
                    yesterday={schedule.yesterday}
                    loading={schedule.loading}
                    failed={schedule.failed}
                    checked={schedule.checked}
                    allDone={schedule.groupDone(i.auto)}
                    marks={marks}
                    onMark={setMark}
                  />
                );
              }
              return (
                <ChecklistRow
                  key={i.key}
                  num={i.num}
                  title={i.title}
                  place={i.place}
                  done={m.done}
                  comment={m.comment}
                  onChange={(p) => setMark(i.key, p)}
                />
              );
            })}
          </div>
        </section>
      ))}

      <div className="text-xs text-gray-400">
        Отметки сохраняются сразу. При нажатии «Смена закончена» чек-лист уходит руководителю через
        окно взаимодействия.
      </div>
    </div>
  );
};

export default TodayTasksView;