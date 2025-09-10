import { DiagData } from '@/types/DiagData';

interface SignatureViewProps {
  diagData: DiagData;
}

export default function SignatureView({ diagData }: SignatureViewProps) {
  return (
    <section className="border-t pt-6">
      <div className="flex justify-between items-end text-sm">
        <div>
          <div><strong>Дата диагностики:</strong> {diagData.diagnosisDate}</div>
        </div>
        <div className="text-right">
          <div><strong>Логопед-диагност:</strong></div>
          <div className="mt-2">{diagData.logopedist}</div>
          <div className="border-b border-gray-400 w-48 mt-6"></div>
        </div>
      </div>
    </section>
  );
}