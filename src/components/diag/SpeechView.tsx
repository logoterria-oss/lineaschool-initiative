import { DiagData } from '@/types/DiagData';
import { formatList } from '@/utils/diagUtils';

interface SpeechViewProps {
  diagData: DiagData;
}

export default function SpeechView({ diagData }: SpeechViewProps) {
  return (
    <>
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
    </>
  );
}