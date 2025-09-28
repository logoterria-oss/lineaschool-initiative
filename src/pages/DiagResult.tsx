import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DiagData {
  // Персональные данные
  childName: string;
  birthDate: string;
  age: string;
  grade: string;
  parentName: string;
  phone: string;
  email: string;
  complaints: string;
  educationForm: string;
  aoop: string;
  schoolStartAge: string;
  kindergarten: string;

  // Анамнестические данные
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

  // Экспрессивная речь
  motorRealization: string[];
  wordFormation: string[];
  grammaticalStructure: string;
  connectedSpeech: string[];
  nominativeFunction: string[];

  // Импрессивная речь
  understandingWords: string;
  complexConstructions: string;
  phonematicPerception: string;

  // Письменная речь
  languageAnalysis: string[];
  readingSkill: string[];
  readingSpeed: string;
  readingComprehension: string;
  writtenSamples: File[];
  dysgraphicErrors: string;
  analysisErrors: string[];
  acousticErrors: string[];
  motorErrors: string[];
  visualMotorErrors: string[];
  spatialErrors: string[];
  additionalWritingFeatures: string[];
  regulationViolations: string[];

  // Заключение
  conclusion: string[];

  // Рекомендации
  recommendations: string[];

  // Направления работы
  workDirections: string[];

  // Дата и логопед
  diagnosisDate: string;
  logopedist: string;
}

const DiagResult = () => {
  const { id } = useParams();
  const [diagData, setDiagData] = useState<DiagData | null>(null);

  useEffect(() => {
    const data = localStorage.getItem(`diag_${id}`);
    if (data) {
      setDiagData(JSON.parse(data));
    }
  }, [id]);

  if (!diagData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation hideBookButton={true} />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="text-3xl font-bold mb-8">Заключение не найдено</h1>
            <p>Диагностические данные не найдены.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const getLogopedistName = (value: string) => {
    const names = {
      'abramenko': 'Абраменко Виктория',
      'naidenova': 'Найденова Анастасия',
      'eremina': 'Еремина Дарья',
      'yanovets': 'Яновець Мила'
    };
    return names[value as keyof typeof names] || value;
  };

  const formatEducationForm = (value: string) => {
    const forms = {
      'school': 'в образовательной организации (школа, лицей, гимназия)',
      'correctional': 'в образовательной организации (коррекционная школа)',
      'family': 'семейное образование'
    };
    return forms[value as keyof typeof forms] || value;
  };

  const formatDominantHand = (value: string) => {
    const hands = {
      'right': 'правша',
      'left': 'левша',
      'retrained': 'правша (переученный левша)'
    };
    return hands[value as keyof typeof hands] || value;
  };

  const formatMotorRealization = (data: DiagData) => {
    const parts: string[] = [];
    
    // Звукопроизношение
    const soundFirst = data.motorRealization[0];
    if (soundFirst === "норма") {
      parts.push("звукопроизношение - норма");
    } else if (soundFirst === "нарушена одна группа звуков") {
      const soundGroups = data.motorRealization.slice(1).filter(item => 
        ["свистящие", "шипящие", "аффрикаты", "Л-Ль", "Р-Рь"].includes(item)
      );
      const otherGroup = (data as any).motorRealizationOther;
      
      let groupText = "";
      if (soundGroups.length > 0) {
        groupText = soundGroups.join(", ");
      }
      if (otherGroup) {
        groupText = groupText ? `${groupText}, ${otherGroup}` : otherGroup;
      }
      
      parts.push(`звукопроизношение - нарушена одна группа звуков${groupText ? ` (${groupText})` : ""}`);
    } else if (soundFirst === "нарушены 2 и более группы звуков") {
      const multipleGroups = (data as any).motorRealizationMultiple;
      parts.push(`звукопроизношение - нарушены 2 и более группы звуков${multipleGroups ? ` (${multipleGroups})` : ""}`);
    }
    
    // Слоговая структура слова
    const syllableItem = data.motorRealization.find(item => item.includes("слоговая структура слова"));
    if (syllableItem) {
      if (syllableItem === "слоговая структура слова не нарушена") {
        parts.push("слоговая структура слова - норма");
      } else if (syllableItem === "слоговая структура слова нарушена") {
        parts.push("слоговая структура слова - нарушена");
      }
    }
    
    // Кинетический артикуляционный праксис
    const kineticItem = data.motorRealization.find(item => item.includes("кинетический артикуляционный праксис"));
    if (kineticItem) {
      if (kineticItem === "кинетический артикуляционный праксис в норме") {
        parts.push("кинетический артикуляционный праксис - норма");
      } else if (kineticItem === "кинетический артикуляционный праксис нарушен") {
        parts.push("кинетический артикуляционный праксис - нарушен");
      }
    }
    
    return parts.join(", ");
  };

  const formatWordFormation = (wordFormation: string[]) => {
    if (wordFormation.includes("норма")) {
      return "норма";
    }
    
    // Если выбрано "нарушены", показываем только конкретные нарушения
    const violations = wordFormation.filter(item => 
      item !== "нарушены" && 
      item !== "норма"
    );
    
    if (violations.length === 0) {
      return "нарушены";
    }
    
    // Убираем слово "нарушено" из начала каждого пункта для более краткой записи
    const shortViolations = violations.map(item => 
      item.replace("нарушено образование ", "")
    );
    
    return shortViolations.join(", ");
  };

  const formatGrammaticalStructure = (value: string) => {
    const formatMap = {
      'норма': 'норма',
      'негрубые аграмматизмы': 'наблюдаются единичные аграмматизмы', 
      'грубые аграмматизмы': 'наблюдаются множественные аграмматизмы'
    };
    return formatMap[value as keyof typeof formatMap] || value;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation hideBookButton={true} />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold text-center mb-8">Логопедическое заключение</h1>
          
          <div className="space-y-6">
            {/* Персональные данные */}
            <Card>
              <CardHeader>
                <CardTitle>Персональные данные</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p><strong>ФИО ребенка:</strong> {diagData.childName}</p>
                  <p><strong>Дата рождения:</strong> {diagData.birthDate}</p>
                  <p><strong>Возраст:</strong> {diagData.age} лет</p>
                  <p><strong>Класс:</strong> {diagData.grade} класс</p>
                  <p><strong>ФИО родителя:</strong> {diagData.parentName}</p>
                  <p><strong>Телефон:</strong> {diagData.phone}</p>
                  <p><strong>E-mail:</strong> {diagData.email}</p>
                </div>
                {diagData.complaints && (
                  <p><strong>Жалобы:</strong> {diagData.complaints}</p>
                )}
                <p><strong>Форма получения образования:</strong> {formatEducationForm(diagData.educationForm)}</p>
                {diagData.aoop && (
                  <p><strong>Реализуется ли АООП:</strong> {diagData.aoop}</p>
                )}
                <p><strong>Возраст начала школьного обучения:</strong> {diagData.schoolStartAge} лет</p>
                <p><strong>Посещал ли детский сад:</strong> {diagData.kindergarten === 'yes' ? 'Да' : 'Нет'}</p>
              </CardContent>
            </Card>

            {/* Анамнестические данные */}
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

            {/* Экспрессивная речь */}
            {(diagData.motorRealization.length > 0 || diagData.wordFormation.length > 0 || 
              diagData.grammaticalStructure || diagData.connectedSpeech.length > 0 || 
              diagData.nominativeFunction.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Экспрессивная речь</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {diagData.motorRealization.length > 0 && (
                    <p><strong>Моторная реализация высказывания:</strong> {formatMotorRealization(diagData)}</p>
                  )}
                  {diagData.wordFormation.length > 0 && (
                    <p><strong>Словообразовательные процессы:</strong> {formatWordFormation(diagData.wordFormation)}</p>
                  )}
                  {diagData.grammaticalStructure && (
                    <p><strong>Сформированность грамматического строя речи:</strong> {formatGrammaticalStructure(diagData.grammaticalStructure)}</p>
                  )}
                  {diagData.connectedSpeech.length > 0 && (
                    <p><strong>Связная речь:</strong> {diagData.connectedSpeech.join(', ')}</p>
                  )}
                  {diagData.nominativeFunction.length > 0 && (
                    <p><strong>Номинативная функция речи:</strong> {diagData.nominativeFunction.join(', ')}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Импрессивная речь */}
            {(diagData.understandingWords || diagData.complexConstructions || diagData.phonematicPerception) && (
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
            )}

            {/* Письменная речь */}
            {(diagData.languageAnalysis.length > 0 || diagData.readingSkill.length > 0 || 
              diagData.readingSpeed || diagData.readingComprehension || diagData.dysgraphicErrors ||
              diagData.analysisErrors.length > 0 || diagData.acousticErrors.length > 0) && (
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
                  {diagData.spatialErrors.length > 0 && (
                    <p><strong>Зрительно-пространственные ошибки:</strong> {diagData.spatialErrors.join(', ')}</p>
                  )}
                </CardContent>
              </Card>
            )}

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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DiagResult;