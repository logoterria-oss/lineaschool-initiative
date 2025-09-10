import { DiagData } from '@/types/DiagData';
import { formatValue, formatList } from '@/utils/diagUtils';

interface AnamnesticsViewProps {
  diagData: DiagData;
}

export default function AnamnesticsView({ diagData }: AnamnesticsViewProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
        Анамнестические данные
      </h2>
      <div className="space-y-3 text-sm">
        <div><strong>Пренатальное развитие:</strong> {diagData.prenatalDevelopment === "custom" ? (diagData.prenatalDevelopmentCustom || "Не указано") : formatValue(diagData.prenatalDevelopment)}</div>
        
        <div><strong>Неврологические нарушения:</strong> {diagData.neurologicalDisorders === "custom" ? (diagData.neurologicalDisordersCustom || "Не указано") : formatValue(diagData.neurologicalDisorders)}</div>
        
        <div><strong>Нарушения слуха/зрения:</strong> {diagData.hearingVisionDisorders === "custom" ? (diagData.hearingVisionDisordersCustom || "Не указано") : formatValue(diagData.hearingVisionDisorders)}</div>
        
        <div><strong>Хронические заболевания:</strong> {diagData.chronicDiseases === "custom" ? (diagData.chronicDiseasesCustom || "Не указано") : formatValue(diagData.chronicDiseases)}</div>
        
        <div><strong>Речевая среда:</strong> {diagData.speechEnvironment === "custom" ? (diagData.speechEnvironmentCustom || "Не указано") : formatValue(diagData.speechEnvironment)}</div>
        
        <div><strong>Ведущая рука:</strong> {formatValue(diagData.dominantHand)}</div>
        <div><strong>Занимался ли ребёнок ранее с коррекционными педагогами и/или психологами?</strong> {formatList(diagData.previousSpecialists)}</div>
        
        {diagData.speechTherapistConclusion && <div><strong>Заключение логопеда:</strong> {diagData.speechTherapistConclusion}</div>}
        {diagData.defectologistConclusion && <div><strong>Заключение дефектолога:</strong> {diagData.defectologistConclusion}</div>}
        {diagData.neuropsychologistConclusion && <div><strong>Заключение нейропсихолога:</strong> {diagData.neuropsychologistConclusion}</div>}
        {diagData.additionalInfo && <div><strong>Дополнительная информация:</strong> {diagData.additionalInfo}</div>}
      </div>
    </section>
  );
}