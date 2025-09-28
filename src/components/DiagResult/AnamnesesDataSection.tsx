import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnamnesesDataSectionProps {
  diagData: {
    prenatalDevelopment: string;
    neurologicalDiseases: string;
    hearingVisionDisorders: string;
    chronicDiseases: string;
    speechEnvironment: string;
    previousTherapy: string[];
    logopedConclusion: string;
    defectologistConclusion: string;
    neuropsychologistConclusion: string;
    dominantHand: string;
    additionalInfo: string;
  };
}

const AnamnesesDataSection = ({ diagData }: AnamnesesDataSectionProps) => {
  const formatDominantHand = (value: string) => {
    const hands = {
      'right': 'правша',
      'left': 'левша',
      'retrained': 'правша (переученный левша)'
    };
    return hands[value as keyof typeof hands] || value;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Анамнестические данные</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p><strong>Особенности пренатального развития:</strong> {diagData.prenatalDevelopment || 'без особенностей'}</p>
        <p><strong>Неврологические заболевания и/или психические расстройства:</strong> {diagData.neurologicalDiseases || 'нет / не диагностировано'}</p>
        <p><strong>Нарушения слуха и/или зрения:</strong> {diagData.hearingVisionDisorders || 'нет / не диагностировано'}</p>
        <p><strong>Другие хронические заболевания:</strong> {diagData.chronicDiseases || 'нет / не диагностировано'}</p>
        <p><strong>Речевое окружение:</strong> {diagData.speechEnvironment || 'нет'}</p>
        {diagData.previousTherapy.length > 0 && (
          <p><strong>Занимался ранее:</strong> {diagData.previousTherapy.join(', ')}</p>
        )}
        {diagData.logopedConclusion && (
          <p><strong>Заключение логопеда:</strong> {diagData.logopedConclusion}</p>
        )}
        {diagData.defectologistConclusion && (
          <p><strong>Заключение дефектолога:</strong> {diagData.defectologistConclusion}</p>
        )}
        {diagData.neuropsychologistConclusion && (
          <p><strong>Заключение нейропсихолога:</strong> {diagData.neuropsychologistConclusion}</p>
        )}
        <p><strong>Ведущая рука:</strong> {formatDominantHand(diagData.dominantHand)}</p>
        {diagData.additionalInfo && (
          <p><strong>Дополнительные сведения:</strong> {diagData.additionalInfo}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AnamnesesDataSection;