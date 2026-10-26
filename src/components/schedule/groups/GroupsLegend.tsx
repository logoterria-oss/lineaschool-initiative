import Icon from '@/components/ui/icon';

/** Пояснения к цветам и пометкам в таблице групп */
const GroupsLegend = ({ maxSize }: { maxSize: number }) => (
  <div className="flex items-center gap-2 mb-2 text-xs text-gray-500 flex-wrap">
    <span>В ячейке — список учеников (до {maxSize}). В скобках возраст.</span>
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
    <span className="inline-flex items-center gap-1">
      <span className="inline-block px-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-semibold">
        9–10 лет
      </span>
      возраст группы
    </span>
  </div>
);

export default GroupsLegend;
