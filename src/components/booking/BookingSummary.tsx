import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Choice, choiceKey } from '@/components/booking/DayCard';

export interface ChosenItem {
  pick: Choice;
  type: 'individual' | 'groups';
}

interface Props {
  chosen: ChosenItem[];
  missing: number;
  canSubmit: boolean;
  sending: boolean;
  onRemove: (item: ChosenItem) => void;
  onSubmit: () => void;
}

/** Нижняя панель: выбранные занятия, подсказки и кнопка «Забронировать» */
const BookingSummary = ({ chosen, missing, canSubmit, sending, onRemove, onSubmit }: Props) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 sticky bottom-4 shadow-sm">
    {chosen.length > 0 ? (
      <div className="mb-3">
        <div className="text-sm font-medium text-gray-800 mb-1.5">Выбрано занятий: {chosen.length}</div>
        <div className="space-y-1">
          {chosen.map((item) => {
            const { pick: p, type } = item;
            return (
              <div key={choiceKey(p)} className="flex items-center gap-2 text-sm text-gray-700">
                <Icon
                  name={type === 'groups' ? 'Users' : 'User'}
                  size={14}
                  className="text-emerald-600 shrink-0"
                />
                <span className="flex-1">
                  {p.weekdayName} в {p.timeFrom}–{p.timeTo} — {p.teacherName}
                </span>
                <button
                  onClick={() => onRemove(item)}
                  className="text-gray-300 hover:text-red-500 shrink-0"
                  title="Убрать"
                >
                  <Icon name="X" size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    ) : (
      <div className="text-sm text-gray-400 mb-3">Выберите время выше</div>
    )}

    {missing > 0 && (
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
        Отметьте время в каждом разделе (разделы раскрываются по нажатию на заголовок) или
        нажмите «Без групповых» / «Без индивидуальных».
      </p>
    )}
    {missing === 0 && chosen.length === 0 && (
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
        Выберите хотя бы одно занятие — иначе бронировать нечего.
      </p>
    )}

    <Button onClick={onSubmit} disabled={!canSubmit} className="w-full gap-2">
      {sending ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Check" size={16} />}
      Забронировать
    </Button>
  </div>
);

export default BookingSummary;
