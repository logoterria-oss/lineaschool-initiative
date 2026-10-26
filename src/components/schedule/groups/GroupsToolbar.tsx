import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { addDays, fmtRu, getMonday } from '../types';

interface Props {
  weekStart: Date;
  onWeekChange: (d: Date) => void;
  childAge: number | null;
  onChildAgeChange: (age: number | null) => void;
  limitsCount: number;
  limitsDisabled: boolean;
  onOpenLimits: () => void;
  onRefresh: () => void;
}

/** Навигация по неделе, фильтр по возрасту, ограничения и обновление */
const GroupsToolbar = ({
  weekStart,
  onWeekChange,
  childAge,
  onChildAgeChange,
  limitsCount,
  limitsDisabled,
  onOpenLimits,
  onRefresh,
}: Props) => (
  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => onWeekChange(addDays(weekStart, -7))} className="gap-1">
        <Icon name="ChevronLeft" size={14} />
        Неделя
      </Button>
      <div className="text-sm font-medium text-gray-700 px-2">
        {fmtRu(weekStart)} — {fmtRu(addDays(weekStart, 6))}
      </div>
      <Button variant="outline" size="sm" onClick={() => onWeekChange(addDays(weekStart, 7))} className="gap-1">
        Неделя
        <Icon name="ChevronRight" size={14} />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onWeekChange(getMonday(new Date()))} className="text-xs">
        Эта неделя
      </Button>
    </div>
    <div className="flex items-center gap-2">
      <div
        className={`inline-flex items-center gap-1.5 h-9 rounded-md border px-3 text-sm font-medium transition-colors ${
          childAge != null
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
            : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
        }`}
      >
        <Icon name="Baby" fallback="User" size={14} className="shrink-0" />
        <select
          value={childAge ?? ''}
          onChange={(e) => onChildAgeChange(e.target.value ? Number(e.target.value) : null)}
          className="h-full bg-transparent outline-none cursor-pointer"
          title="Оставить только группы, подходящие по возрасту"
        >
          <option value="">Возраст ребёнка: все группы</option>
          {Array.from({ length: 11 }, (_, i) => i + 6).map((a) => (
            <option key={a} value={a}>
              Ребёнку {a} лет
            </option>
          ))}
        </select>
        {childAge != null && (
          <button
            type="button"
            onClick={() => onChildAgeChange(null)}
            className="shrink-0 text-indigo-400 hover:text-indigo-700"
            title="Сбросить фильтр"
          >
            <Icon name="X" size={14} />
          </button>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={onOpenLimits} disabled={limitsDisabled} className="gap-1.5">
        <Icon name="SlidersHorizontal" size={14} />
        Ограничить количество слотов
        {limitsCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gray-200 text-gray-700 text-[11px] font-bold">
            {limitsCount}
          </span>
        )}
      </Button>
      <Button variant="outline" size="sm" onClick={onRefresh} className="gap-1.5">
        <Icon name="RefreshCw" size={14} />
        Обновить
      </Button>
    </div>
  </div>
);

export default GroupsToolbar;