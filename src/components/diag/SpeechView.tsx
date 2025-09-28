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

  // Функция для форматирования моторной реализации
  const formatMotorRealization = (data: any) => {
    const parts: string[] = [];
    
    // Звукопроизношение
    const soundFirst = data.motorRealization[0];
    if (soundFirst === "норма") {
      parts.push("звукопроизношение - норма");
    } else if (soundFirst === "нарушена одна группа звуков") {
      const soundGroups = data.motorRealization.slice(1).filter((item: string) => 
        ["свистящие", "шипящие", "аффрикаты", "Л-Ль", "Р-Рь"].includes(item)
      );
      const otherGroup = data.motorRealizationOther;
      
      let groupText = "";
      if (soundGroups.length > 0) {
        groupText = soundGroups.join(", ");
      }
      if (otherGroup) {
        groupText = groupText ? `${groupText}, ${otherGroup}` : otherGroup;
      }
      
      parts.push(`звукопроизношение - нарушена одна группа звуков${groupText ? ` (${groupText})` : ""}`);
    } else if (soundFirst === "нарушены 2 и более группы звуков") {
      const multipleGroups = data.motorRealizationMultiple;
      parts.push(`звукопроизношение - нарушены 2 и более группы звуков${multipleGroups ? ` (${multipleGroups})` : ""}`);
    }
    
    // Слоговая структура слова
    const syllableItem = data.motorRealization.find((item: string) => item.includes("слоговая структура слова"));
    if (syllableItem) {
      parts.push(syllableItem);
    }
    
    // Кинетический артикуляционный праксис
    const kineticItem = data.motorRealization.find((item: string) => item.includes("кинетический артикуляционный праксис"));
    if (kineticItem) {
      parts.push(kineticItem);
    }
    
    return parts.join(", ");
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
          <div><strong>Моторная реализация высказывания:</strong> {formatMotorRealization(diagData)}</div>
          <div><strong>Словообразование:</strong> {formatList(diagData.wordFormation)}</div>
          <div><strong>Грамматический строй речи:</strong> {diagData.grammaticalStructure}</div>
          <div><strong>Связная речь:</strong> {formatList(diagData.connectedSpeech)}</div>

        </div>
      </section>
    </>
  );
}