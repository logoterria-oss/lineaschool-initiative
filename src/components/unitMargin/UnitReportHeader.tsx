import Icon from '@/components/ui/icon';

interface Props {
  onBack: () => void;
}

/** Шапка отчёта: возврат назад и пояснение, что считаем юнитом. */
export default function UnitReportHeader({ onBack }: Props) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={onBack}
        className="text-gray-400 hover:text-gray-700 transition-colors"
      >
        <Icon name="ArrowLeft" size={20} />
      </button>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Маржинальность урока
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Юнит — одно проведённое занятие целиком. Индивидуальные и групповые
          считаем отдельно, по факту месяца из CRM
        </p>
      </div>
    </div>
  );
}
