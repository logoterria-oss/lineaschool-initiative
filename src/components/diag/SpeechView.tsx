import { DiagData } from '@/types/DiagData';
import { formatList } from '@/utils/diagUtils';

interface SpeechViewProps {
  diagData: DiagData;
}

export default function SpeechView({ diagData }: SpeechViewProps) {
  // Функция для обработки фонематического восприятия
  const formatPhonemicPerception = (value: string) => {
    if (!value) return value;
    // Убираем текст в скобках
    return value.replace(/\s*\([^)]*\)/g, '');
  };

  return (
    <>
      {/* Импрессивная речь */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
          Импрессивная речь (понимание речи)
        </h2>
        <div className="space-y-3 text-sm">
          <div><strong>Понимание слов, обозначающих названия предметов и действий:</strong> {diagData.wordUnderstanding}</div>
          <div><strong>Понимание сложных логико-грамматических конструкций:</strong> {diagData.complexConstructions}</div>
          <div><strong>Фонематическое восприятие:</strong> {formatPhonemicPerception(diagData.phonematicPerception)}</div>
        </div>
      </section>

      {/* Экспрессивная речь */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
          Экспрессивная речь (воспроизведение речи)
        </h2>
        <div className="space-y-3 text-sm">
          <div><strong>Моторная реализация высказывания:</strong> {formatList(diagData.motorRealization)}</div>
          <div><strong>Словообразование:</strong> {formatList(diagData.wordFormation)}</div>
          <div><strong>Грамматический строй речи:</strong> {diagData.grammaticalStructure}</div>
          <div><strong>Связная речь:</strong> {formatList(diagData.connectedSpeech)}</div>

        </div>
      </section>
    </>
  );
}