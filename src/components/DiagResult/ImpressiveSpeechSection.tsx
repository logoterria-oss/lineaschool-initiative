import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ImpressiveSpeechSectionProps {
  diagData: {
    understandingWords: string;
    complexConstructions: string;
    phonematicPerception: string;
  };
}

const ImpressiveSpeechSection = ({ diagData }: ImpressiveSpeechSectionProps) => {
  // Проверяем, есть ли данные для отображения
  const hasData = diagData.understandingWords || 
                  diagData.complexConstructions || 
                  diagData.phonematicPerception;

  if (!hasData) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Импрессивная речь</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {diagData.understandingWords && (
          <p><strong>Понимание слов:</strong> {diagData.understandingWords}</p>
        )}
        {diagData.complexConstructions && (
          <p><strong>Понимание сложных конструкций:</strong> {diagData.complexConstructions}</p>
        )}
        {diagData.phonematicPerception && (
          <p><strong>Фонематическое восприятие:</strong> {diagData.phonematicPerception}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ImpressiveSpeechSection;