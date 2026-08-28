import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface Props {
  title: string;
  /** Общая ссылка — имя ребёнка спрашиваем прямо здесь */
  askChildName?: boolean;
  childName: string;
  onChildNameChange: (value: string) => void;
  value: string;
  min: string;
  loading: boolean;
  error?: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

/** Первый шаг записи: спрашиваем, с какого числа ребёнок готов начать */
const StartDateScreen = ({
  title,
  askChildName,
  childName,
  onChildNameChange,
  value,
  min,
  loading,
  error,
  onChange,
  onSubmit,
}: Props) => {
  const ready = !!value && (!askChildName || !!childName.trim());

  return (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
    <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full">
      <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
        <Icon name="CalendarDays" size={26} className="text-emerald-600" />
      </div>

      <h1 className="text-xl font-bold text-gray-800 text-center mb-2">{title}</h1>
      <p className="text-gray-500 text-sm text-center mb-6">
        {askChildName
          ? 'Расскажите, кого записываем и когда удобно начать'
          : childName
            ? `С какого числа ${childName} готов начать занятия?`
            : 'С какого числа ребёнок готов начать занятия?'}
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4">
          {error}
        </div>
      )}

      {askChildName && (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Фамилия и имя ребёнка <span className="text-red-500">*</span>
          </label>
          <Input
            value={childName}
            onChange={(e) => onChildNameChange(e.target.value)}
            placeholder="Например, Иванова Маша"
            className="mb-4"
          />
        </>
      )}

      <label className="block text-sm font-medium text-gray-700 mb-1">Дата начала занятий</label>
      <Input
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !loading && ready) onSubmit();
        }}
        className="mb-4"
      />

      <Button onClick={onSubmit} disabled={loading || !ready} className="w-full gap-2">
        {loading ? (
          <Icon name="Loader2" size={16} className="animate-spin" />
        ) : (
          <Icon name="ArrowRight" size={16} />
        )}
        Показать свободное время
      </Button>

      <p className="text-xs text-gray-400 text-center mt-4">
        Покажем окна, свободные каждую неделю начиная с этой даты
      </p>
    </div>
  </div>
  );
};

export default StartDateScreen;