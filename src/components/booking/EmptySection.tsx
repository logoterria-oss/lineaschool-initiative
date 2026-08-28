import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface Props {
  /** Расписание не ответило — это не то же самое, что «мест нет» */
  failed?: boolean;
  onRetry: () => void;
}

/** Заглушка раздела: окон нет или расписание не загрузилось */
const EmptySection = ({ failed, onRetry }: Props) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
    <Icon
      name={failed ? 'CloudOff' : 'CalendarOff'}
      size={28}
      className="mx-auto mb-2 text-gray-400"
    />
    <p className="text-gray-600 text-sm mb-3">
      {failed
        ? 'Не удалось загрузить расписание'
        : 'Свободного времени с этой даты нет'}
    </p>
    <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
      <Icon name="RefreshCw" size={14} />
      {failed ? 'Попробовать снова' : 'Обновить'}
    </Button>
  </div>
);

export default EmptySection;
