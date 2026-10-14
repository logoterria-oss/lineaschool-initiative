import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface Props {
  title: string;
  childName: string;
  parentName: string;
  childLocked?: boolean;
  onChildNameChange: (value: string) => void;
  onParentNameChange: (value: string) => void;
  onSubmit: () => void;
}

/** Первый шаг записи на диагностику: кого записываем */
const DiagNamesScreen = ({
  title,
  childName,
  parentName,
  childLocked,
  onChildNameChange,
  onParentNameChange,
  onSubmit,
}: Props) => {
  const ready = !!childName.trim() && !!parentName.trim();
  const enter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && ready) onSubmit();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full">
        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <Icon name="CalendarDays" size={26} className="text-emerald-600" />
        </div>

        <h1 className="text-xl font-bold text-gray-800 text-center mb-2">{title}</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Расскажите, кого записываем</p>

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Имя и фамилия ребёнка <span className="text-red-500">*</span>
        </label>
        <Input
          value={childName}
          onChange={(e) => onChildNameChange(e.target.value)}
          onKeyDown={enter}
          disabled={childLocked}
          placeholder="Например, Маша Иванова"
          className="mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Имя и фамилия ответственного родителя <span className="text-red-500">*</span>
        </label>
        <Input
          value={parentName}
          onChange={(e) => onParentNameChange(e.target.value)}
          onKeyDown={enter}
          placeholder="Например, Анна Иванова"
          className="mb-4"
        />

        <Button onClick={onSubmit} disabled={!ready} className="w-full gap-2">
          <Icon name="ArrowRight" size={16} />
          Показать свободное время
        </Button>
      </div>
    </div>
  );
};

export default DiagNamesScreen;