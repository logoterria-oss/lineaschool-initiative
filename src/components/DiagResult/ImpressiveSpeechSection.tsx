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

  // Форматирование фонематического восприятия - убираем скобки для заключения
  const formatPhonematicPerception = (value: string) => {
    if (value === "не соответствует возрастной норме (1-2 ошибки в пробе)") {
      return "не соответствует возрастной норме";
    }
    return value;
  };

  // Форматирование понимания слов - полная формулировка
  const formatWordUnderstanding = (value: string) => {
    if (value === "норма") {
      return "понимание слов, обозначающих названия предметов и действий, в норме";
    } else if (value === "нарушено") {
      return "понимание слов, обозначающих названия предметов и действий, нарушено";
    }
    return value;
  };

  // Форматирование понимания сложных конструкций - полная формулировка
  const formatComplexConstructions = (value: string) => {
    if (value === "норма") {
      return "понимание сложных лексико-грамматических конструкций в норме";
    } else if (value === "нарушено") {
      return "понимание сложных лексико-грамматических конструкций нарушено";
    }
    return value;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Импрессивная речь</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {diagData.understandingWords && (
          <p><strong>Понимание слов:</strong> {formatWordUnderstanding(diagData.understandingWords)}</p>
        )}
        {diagData.complexConstructions && (
          <p><strong>Понимание сложных конструкций:</strong> {formatComplexConstructions(diagData.complexConstructions)}</p>
        )}
        {diagData.phonematicPerception && (
          <p><strong>Фонематическое восприятие:</strong> {formatPhonematicPerception(diagData.phonematicPerception)}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ImpressiveSpeechSection;