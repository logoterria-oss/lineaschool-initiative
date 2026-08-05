import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WrittenSpeechSectionProps {
  diagData: {
    languageAnalysis: string[];
    readingSkill: string[];
    readingSpeed: string;
    readingComprehension: string;
    dysgraphicErrors: string;
    dysorthographicErrors: string;
    totalErrors: string;
    analysisErrors: string[];
    acousticErrors: string[];
    motorErrors: string[];
    visualMotorErrors: string[];
    visualSpatialErrors: string[];
    additionalCharacteristics: string[];
    regulationViolations: string[];
    regulationViolationsOther?: string;
  };
}

const WrittenSpeechSection = ({ diagData }: WrittenSpeechSectionProps) => {
  const hasData = diagData.languageAnalysis.length > 0 ||
                  diagData.readingSkill.length > 0 ||
                  diagData.readingSpeed ||
                  diagData.readingComprehension ||
                  diagData.dysgraphicErrors ||
                  diagData.dysorthographicErrors ||
                  diagData.totalErrors ||
                  diagData.analysisErrors.length > 0 ||
                  diagData.acousticErrors.length > 0 ||
                  diagData.motorErrors.length > 0 ||
                  diagData.visualMotorErrors.length > 0 ||
                  diagData.visualSpatialErrors.length > 0 ||
                  diagData.additionalCharacteristics.length > 0 ||
                  diagData.regulationViolations.length > 0 ||
                  diagData.regulationViolationsOther;

  if (!hasData) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Письменная речь</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {diagData.languageAnalysis.length > 0 && (
          <p><strong>Языковой анализ:</strong> {diagData.languageAnalysis.join(', ')}</p>
        )}
        {diagData.readingSkill.length > 0 && (
          <p><strong>Навык чтения:</strong> {diagData.readingSkill.join(', ')}</p>
        )}
        {diagData.readingSpeed && (
          <p><strong>Скорость чтения:</strong> {diagData.readingSpeed} слов/мин</p>
        )}
        {diagData.readingComprehension && (
          <p><strong>Понимание прочитанного:</strong> {diagData.readingComprehension}%</p>
        )}
        {diagData.dysgraphicErrors && (
          <p><strong>Количество дисграфических ошибок:</strong> {diagData.dysgraphicErrors}</p>
        )}
        {diagData.dysorthographicErrors && (
          <p><strong>Количество орфографических ошибок:</strong> {diagData.dysorthographicErrors}</p>
        )}
        {diagData.totalErrors && (
          <p><strong>Ошибок всего:</strong> {diagData.totalErrors}</p>
        )}
        {diagData.analysisErrors.length > 0 && (
          <p><strong>Ошибки языкового анализа:</strong> {diagData.analysisErrors.join(', ')}</p>
        )}
        {diagData.acousticErrors.length > 0 && (
          <p><strong>Ошибки акустико-артикуляторного сходства:</strong> {diagData.acousticErrors.join(', ')}</p>
        )}
        {diagData.motorErrors.length > 0 && (
          <p><strong>Моторные ошибки:</strong> {diagData.motorErrors.join(', ')}</p>
        )}
        {diagData.visualMotorErrors.length > 0 && (
          <p><strong>Зрительно-моторные ошибки:</strong> {diagData.visualMotorErrors.join(', ')}</p>
        )}
        {diagData.visualSpatialErrors.length > 0 && (
          <p><strong>Зрительно-пространственные ошибки:</strong> {diagData.visualSpatialErrors.join(', ')}</p>
        )}
        {diagData.additionalCharacteristics.length > 0 && (
          <p><strong>Дополнительные характеристики:</strong> {diagData.additionalCharacteristics.join(', ')}</p>
        )}
        {(diagData.regulationViolations.length > 0 || diagData.regulationViolationsOther) && (
          <p><strong>Нарушения регуляции:</strong> {[
            ...diagData.regulationViolations,
            ...(diagData.regulationViolationsOther ? [diagData.regulationViolationsOther] : [])
          ].join(', ')}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default WrittenSpeechSection;