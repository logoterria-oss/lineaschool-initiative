import { DiagData } from '@/types/DiagData';

interface SignatureViewProps {
  diagData: DiagData;
}

export default function SignatureView({ diagData }: SignatureViewProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return new Date().toLocaleDateString('ru-RU');
    try {
      return new Date(dateStr).toLocaleDateString('ru-RU');
    } catch {
      return dateStr;
    }
  };

  return (
    <section className="border-t pt-6 mt-8">
      <div className="grid grid-cols-2 gap-8 text-sm">
        <div>
          <div className="border-b border-gray-800 pb-1 mb-2 text-center min-h-[30px] flex items-end justify-center">
            {diagData.logopedist || 'Логопед-диагност'}
          </div>
          <div className="text-center text-xs text-gray-600">Подпись специалиста</div>
        </div>
        <div>
          <div className="border-b border-gray-800 pb-1 mb-2 text-center min-h-[30px] flex items-end justify-center">
            {formatDate(diagData.diagnosisDate)}
          </div>
          <div className="text-center text-xs text-gray-600">Дата</div>
        </div>
      </div>
    </section>
  );
}