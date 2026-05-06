import { DiagData } from '@/types/DiagData';
import { formatList } from '@/utils/diagUtils';

interface WrittenSpeechViewProps {
  diagData: DiagData;
  onImageClick: (image: string) => void;
}

export default function WrittenSpeechView({ diagData, onImageClick }: WrittenSpeechViewProps) {
  const formatRegulationViolations = () => {
    const checkboxItems = formatList(diagData.regulationViolations);
    const customText = diagData.regulationViolationsOther?.trim();
    
    if (checkboxItems && customText) {
      return `${checkboxItems}, ${customText}`;
    }
    return checkboxItems || customText || '';
  };

  const regulationText = formatRegulationViolations();

  return (
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
                    onClick={() => onImageClick(sample.startsWith('data:') ? sample : `data:image/jpeg;base64,${sample}`)}
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
        <div><strong>Дизорфографические ошибки:</strong> {diagData.dysorthographicErrors || 'Не указано'}</div>
        <div><strong>Ошибок всего:</strong> {diagData.totalErrors || 'Не указано'}</div>
        <div><strong>Ошибки анализа:</strong> {formatList(diagData.analysisErrors)}</div>
        <div><strong>Акустические ошибки:</strong> {formatList(diagData.acousticErrors)}</div>
        <div><strong>Моторные ошибки:</strong> {formatList(diagData.motorErrors)}</div>
        <div><strong>Зрительно-моторные ошибки:</strong> {formatList(diagData.visualMotorErrors)}</div>
        <div><strong>Зрительно-пространственные ошибки:</strong> {formatList(diagData.visualSpatialErrors)}</div>
        <div><strong>Дополнительные характеристики:</strong> {formatList(diagData.additionalCharacteristics)}</div>
        {regulationText && <div><strong>Нарушения регуляции письменной деятельности:</strong> {regulationText}</div>}
      </div>
    </section>
  );
}