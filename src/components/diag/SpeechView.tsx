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
  const formatMotorRealization = (data: DiagData) => {
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

  // Функция для форматирования связной речи
  const formatConnectedSpeech = (data: DiagData) => {
    if (!data.connectedSpeech || data.connectedSpeech.length === 0) {
      return "не оценивалась";
    }

    const connectedSpeech = Array.isArray(data.connectedSpeech) ? data.connectedSpeech : [data.connectedSpeech];
    
    // Проверяем основное состояние
    if (connectedSpeech.some((item: string) => item === "норма")) {
      return "норма";
    }
    
    if (connectedSpeech.some((item: string) => item === "нарушена")) {
      const details: string[] = [];
      
      // Проблемы со словарем
      if (connectedSpeech.some((item: string) => item === "бедность активного словаря")) {
        details.push("Объем активного словаря не соответствует возрастной норме");
      }
      if (connectedSpeech.some((item: string) => item === "объем активного словаря не соответствует возрастной норме")) {
        details.push("Объем активного словаря не соответствует возрастной норме");
      }
      
      // Вербальные парафазии
      if (connectedSpeech.some((item: string) => item === "наблюдаются вербальные парафазии")) {
        details.push("наблюдаются вербальные парафазии");
      }
      
      // Нарушения при составлении рассказа
      const storyProblems: string[] = [];
      if (connectedSpeech.some((item: string) => item === "смысловая неадекватность")) {
        storyProblems.push("нарушение логики передачи замысла");
      }
      if (connectedSpeech.some((item: string) => item === "нарушение логики передачи замысла")) {
        storyProblems.push("нарушение логики передачи замысла");
      }
      if (connectedSpeech.some((item: string) => item.includes("пропуск"))) {
        storyProblems.push("пропуск смысловых звеньев и связующих элементов");
      }
      if (connectedSpeech.some((item: string) => item === "неоднократные необоснованные повторы")) {
        storyProblems.push("неоднократные необоснованные повторы");
      }
      if (connectedSpeech.some((item: string) => item === "малая длина синтагм")) {
        storyProblems.push("малая длина синтагм, которая указывает на синтагматические трудности, т.е. функциональную недостаточность передних отделов коры");
      }
      if (connectedSpeech.some((item: string) => item === "малая длина текста")) {
        storyProblems.push("малая длина текста, которая указывает на трудности программирования и структурирования");
      }
      
      if (storyProblems.length > 0) {
        details.push(`При составлении рассказа по серии сюжетных картинок наблюдается ${storyProblems.join(", ")}`);
      }
      
      // Другие нарушения
      const otherProblems = data.connectedSpeechOther;
      if (otherProblems) {
        details.push(otherProblems);
      }
      
      return `нарушена. ${details.join(". ")}`;
    }
    
    // Если есть другие варианты
    return formatList(connectedSpeech);
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
          <div><strong>Грамматический строй речи:</strong> {diagData.grammaticalStructure}</div>
          <div><strong>Связная речь:</strong> {formatConnectedSpeech(diagData)}</div>

        </div>
      </section>
    </>
  );
}