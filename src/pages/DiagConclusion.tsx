import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Footer from "@/components/Footer";
import DiagFormNavigation from "@/components/diag/DiagFormNavigation";
import Icon from "@/components/ui/icon";

interface DiagData {
  childName: string;
  birthDate: string;
  age: string;
  grade: string;
  parentName: string;
  phone: string;
  email: string;
  complaints: string;
  educationType: string;
  aoop: string;
  schoolStartAge: string;
  kindergarten: string;
  prenatalDevelopment: string;
  prenatalDevelopmentCustom: string;
  neurologicalDisorders: string;
  neurologicalDisordersCustom: string;
  hearingVisionDisorders: string;
  hearingVisionDisordersCustom: string;
  chronicDiseases: string;
  chronicDiseasesCustom: string;
  speechEnvironment: string;
  speechEnvironmentCustom: string;
  previousSpecialists: string[];
  speechTherapistConclusion: string;
  defectologistConclusion: string;
  neuropsychologistConclusion: string;
  dominantHand: string;
  additionalInfo: string;
  motorRealization: string[];
  wordFormation: string[];
  grammaticalStructure: string;
  connectedSpeech: string[];
  nominativeFunction: string[];
  wordUnderstanding: string;
  complexConstructions: string;
  phonematicPerception: string;
  languageAnalysis: string[];
  readingSkill: string[];
  readingSpeed: string;
  readingComprehension: string;
  writingSamples: string[];
  dysgraphicErrors: string;
  analysisErrors: string[];
  acousticErrors: string[];
  motorErrors: string[];
  visualMotorErrors: string[];
  visualSpatialErrors: string[];
  additionalCharacteristics: string[];
  regulationViolations: string[];
  speechDisorders: string[];
  dyslexiaTypes: string[];
  dysgraphiaTypes: string[];
  brainSyndromes: string[];
  recommendations: string[];
  workDirections: string[];
  diagnosisDate: string;
  logopedist: string;
}

export default function DiagConclusion() {
  const { serialNumber } = useParams();
  const [diagData, setDiagData] = useState<DiagData | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const savedData = localStorage.getItem('diagData');
    if (savedData) {
      setDiagData(JSON.parse(savedData));
    }
  }, []);

  if (!diagData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Загрузка данных...</h2>
          <p className="text-gray-600">Пожалуйста, подождите</p>
        </div>
      </div>
    );
  }

  const translateValue = (value: string) => {
    const translations: Record<string, string> = {
      // Тип образования
      'general': 'Общее',
      'special': 'Специальное',
      'inclusive': 'Инклюзивное',
      
      // Ведущая рука
      'right': 'Правая',
      'left': 'Левая',
      'ambidextrous': 'Обе руки',
      
      // Класс обучения
      'regular': 'Общеобразовательный',
      'correctional': 'Коррекционный',
      
      // Другие возможные значения
      'yes': 'Да',
      'no': 'Нет',
      'unknown': 'Неизвестно'
    };
    
    return translations[value] || value;
  };

  const formatList = (items: string[]) => {
    return items.length > 0 ? items.map(translateValue).join(', ') : 'Не указано';
  };

  const formatValue = (value: string | string[]) => {
    if (Array.isArray(value)) {
      return formatList(value);
    }
    return translateValue(value) || 'Не указано';
  };

  return (
    <div className="min-h-screen bg-white">
      <DiagFormNavigation />

      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Логопедическое заключение
            </h1>
            <p className="text-lg text-gray-600">№ {serialNumber}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-8 space-y-8">
            
            {/* Персональные данные */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
                Персональные данные
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>ФИО ребенка:</strong> {diagData.childName}</div>
                <div><strong>Дата рождения:</strong> {diagData.birthDate}</div>
                <div><strong>Возраст:</strong> {diagData.age}</div>
                <div><strong>Класс:</strong> {diagData.grade}</div>
                <div><strong>ФИО родителя:</strong> {diagData.parentName}</div>
                <div><strong>Телефон:</strong> {diagData.phone}</div>
                <div><strong>Email:</strong> {diagData.email}</div>
                <div><strong>Тип образования:</strong> {diagData.educationType}</div>
                <div><strong>АООП:</strong> {diagData.aoop}</div>
                <div><strong>Возраст поступления в школу:</strong> {diagData.schoolStartAge}</div>
                <div><strong>Детский сад:</strong> {diagData.kindergarten}</div>
              </div>
              {diagData.complaints && (
                <div className="mt-4">
                  <strong>Жалобы:</strong> {diagData.complaints}
                </div>
              )}
            </section>

            {/* Анамнестические данные */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
                Анамнестические данные
              </h2>
              <div className="space-y-3 text-sm">
                <div><strong>Пренатальное развитие:</strong> {diagData.prenatalDevelopment}</div>
                {diagData.prenatalDevelopmentCustom && <div className="ml-4 text-gray-600">{diagData.prenatalDevelopmentCustom}</div>}
                
                <div><strong>Неврологические нарушения:</strong> {diagData.neurologicalDisorders}</div>
                {diagData.neurologicalDisordersCustom && <div className="ml-4 text-gray-600">{diagData.neurologicalDisordersCustom}</div>}
                
                <div><strong>Нарушения слуха/зрения:</strong> {diagData.hearingVisionDisorders}</div>
                {diagData.hearingVisionDisordersCustom && <div className="ml-4 text-gray-600">{diagData.hearingVisionDisordersCustom}</div>}
                
                <div><strong>Хронические заболевания:</strong> {diagData.chronicDiseases}</div>
                {diagData.chronicDiseasesCustom && <div className="ml-4 text-gray-600">{diagData.chronicDiseasesCustom}</div>}
                
                <div><strong>Речевая среда:</strong> {diagData.speechEnvironment}</div>
                {diagData.speechEnvironmentCustom && <div className="ml-4 text-gray-600">{diagData.speechEnvironmentCustom}</div>}
                
                <div><strong>Консультации специалистов:</strong> {formatList(diagData.previousSpecialists)}</div>
                <div><strong>Ведущая рука:</strong> {diagData.dominantHand}</div>
                
                {diagData.speechTherapistConclusion && <div><strong>Заключение логопеда:</strong> {diagData.speechTherapistConclusion}</div>}
                {diagData.defectologistConclusion && <div><strong>Заключение дефектолога:</strong> {diagData.defectologistConclusion}</div>}
                {diagData.neuropsychologistConclusion && <div><strong>Заключение нейропсихолога:</strong> {diagData.neuropsychologistConclusion}</div>}
                {diagData.additionalInfo && <div><strong>Дополнительная информация:</strong> {diagData.additionalInfo}</div>}
              </div>
            </section>

            {/* Экспрессивная речь */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
                Экспрессивная речь
              </h2>
              <div className="space-y-3 text-sm">
                <div><strong>Моторная реализация:</strong> {formatList(diagData.motorRealization)}</div>
                <div><strong>Словообразование:</strong> {formatList(diagData.wordFormation)}</div>
                <div><strong>Грамматический строй:</strong> {diagData.grammaticalStructure}</div>
                <div><strong>Связная речь:</strong> {formatList(diagData.connectedSpeech)}</div>
                <div><strong>Номинативная функция:</strong> {formatList(diagData.nominativeFunction)}</div>
              </div>
            </section>

            {/* Импрессивная речь */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
                Импрессивная речь
              </h2>
              <div className="space-y-3 text-sm">
                <div><strong>Понимание слов:</strong> {diagData.wordUnderstanding}</div>
                <div><strong>Сложные конструкции:</strong> {diagData.complexConstructions}</div>
                <div><strong>Фонематическое восприятие:</strong> {diagData.phonematicPerception}</div>
              </div>
            </section>

            {/* Письменная речь */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
                Письменная речь
              </h2>
              <div className="space-y-3 text-sm">
                <div><strong>Языковой анализ:</strong> {formatList(diagData.languageAnalysis)}</div>
                <div><strong>Навык чтения:</strong> {formatList(diagData.readingSkill)}</div>
                <div><strong>Скорость чтения:</strong> {diagData.readingSpeed ? `${diagData.readingSpeed} слов/мин` : 'Не указано'}</div>
                <div><strong>Понимание прочитанного:</strong> {diagData.readingComprehension ? `${diagData.readingComprehension}%` : 'Не указано'}</div>
                
                {/* Примеры письменных работ */}
                {diagData.writingSamples && diagData.writingSamples.length > 0 && (
                  <div>
                    <strong>Примеры письменных работ:</strong>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {diagData.writingSamples.map((sample, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                          <img 
                            src={sample.startsWith('data:') ? sample : `data:image/jpeg;base64,${sample}`}
                            alt={`Письменная работа ${index + 1}`}
                            className="w-full h-auto max-h-80 object-contain rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setSelectedImage(sample.startsWith('data:') ? sample : `data:image/jpeg;base64,${sample}`)}
                            onError={(e) => {
                              console.error('Ошибка загрузки изображения:', sample.substring(0, 50));
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzNkNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkl6b2JyYXplbmllIG5lIHphZ3J1emVubz88L3RleHQ+PC9zdmc+';
                            }}
                          />
                          <div className="text-center text-xs text-gray-500 mt-2">
                            Образец письменной работы {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div><strong>Дисграфические ошибки:</strong> {diagData.dysgraphicErrors || 'Не указано'}</div>
                <div><strong>Ошибки анализа:</strong> {formatList(diagData.analysisErrors)}</div>
                <div><strong>Акустические ошибки:</strong> {formatList(diagData.acousticErrors)}</div>
                <div><strong>Моторные ошибки:</strong> {formatList(diagData.motorErrors)}</div>
                <div><strong>Зрительно-моторные ошибки:</strong> {formatList(diagData.visualMotorErrors)}</div>
                <div><strong>Зрительно-пространственные ошибки:</strong> {formatList(diagData.visualSpatialErrors)}</div>
                <div><strong>Дополнительные характеристики:</strong> {formatList(diagData.additionalCharacteristics)}</div>
                <div><strong>Нарушения регуляции:</strong> {formatList(diagData.regulationViolations)}</div>
              </div>
            </section>

            {/* Заключение */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
                Заключение
              </h2>
              <div className="text-sm leading-relaxed">
                {(() => {
                  const conclusionParts = [];
                  
                  if (diagData.speechDisorders && diagData.speechDisorders.length > 0) {
                    conclusionParts.push(diagData.speechDisorders.join(', '));
                  }
                  
                  if (diagData.dyslexiaTypes && diagData.dyslexiaTypes.length > 0) {
                    conclusionParts.push(diagData.dyslexiaTypes.join(', '));
                  }
                  
                  if (diagData.dysgraphiaTypes && diagData.dysgraphiaTypes.length > 0) {
                    conclusionParts.push(diagData.dysgraphiaTypes.join(', '));
                  }
                  
                  if (diagData.brainSyndromes && diagData.brainSyndromes.length > 0) {
                    conclusionParts.push(diagData.brainSyndromes.join(', '));
                  }
                  
                  return conclusionParts.length > 0 
                    ? conclusionParts.join('. ') + '.'
                    : 'Заключение не сформировано.';
                })()}
              </div>
            </section>

            {/* Рекомендации */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
                Рекомендации и направления работы
              </h2>
              <div className="space-y-4 text-sm">
                {diagData.recommendations && diagData.recommendations.length > 0 && (
                  <div>
                    <strong>Рекомендации:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1 ml-4">
                      {diagData.recommendations.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ol>
                  </div>
                )}
                
                {diagData.workDirections && diagData.workDirections.length > 0 && (
                  <div>
                    <strong>Направления работы:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1 ml-4">
                      {diagData.workDirections.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </section>

            {/* Подпись */}
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
          </div>
        </div>
      </main>

      <Footer />

      {/* Модальное окно для просмотра изображения */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img 
              src={selectedImage}
              alt="Увеличенное изображение"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all"
            >
              <Icon name="X" size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}