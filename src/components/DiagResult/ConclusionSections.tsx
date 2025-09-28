import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConclusionSectionsProps {
  diagData: {
    conclusion: string[];
    recommendations: string[];
    workDirections: string[];
    diagnosisDate: string;
    logopedist: string;
  };
}

const ConclusionSections = ({ diagData }: ConclusionSectionsProps) => {
  const getLogopedistName = (value: string) => {
    const names = {
      'abramenko': 'Абраменко Виктория',
      'naidenova': 'Найденова Анастасия',
      'eremina': 'Еремина Дарья',
      'yanovets': 'Яновець Мила'
    };
    return names[value as keyof typeof names] || value;
  };

  return (
    <>
      {/* Заключение */}
      {diagData.conclusion.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Заключение</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{diagData.conclusion.join(', ')}</p>
          </CardContent>
        </Card>
      )}

      {/* Рекомендации */}
      {diagData.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Рекомендации</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{diagData.recommendations.join(', ')}</p>
          </CardContent>
        </Card>
      )}

      {/* Направления работы */}
      {diagData.workDirections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Направления работы</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{diagData.workDirections.join(', ')}</p>
          </CardContent>
        </Card>
      )}

      {/* Информация о диагностике */}
      <Card>
        <CardHeader>
          <CardTitle>Информация о диагностике</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p><strong>Дата диагностики:</strong> {diagData.diagnosisDate}</p>
            <p><strong>Логопед-диагност:</strong> {getLogopedistName(diagData.logopedist)}</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ConclusionSections;