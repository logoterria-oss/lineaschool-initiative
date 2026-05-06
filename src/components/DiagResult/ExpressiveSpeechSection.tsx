import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExpressiveSpeechSectionProps {
  diagData: {
    motorRealization: string[];
    motorRealizationMultiple?: string;
    motorRealizationOther?: string;
    wordFormation: string[];
    grammaticalStructure: string;
    connectedSpeech: string[];
    nominativeFunction: string[];
  };
}

const ExpressiveSpeechSection = ({ diagData }: ExpressiveSpeechSectionProps) => {
  const formatMotorRealization = (data: ExpressiveSpeechSectionProps['diagData']) => {
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
      if (syllableItem === "слоговая структура слова не нарушена") {
        parts.push("слоговая структура слова - норма");
      } else if (syllableItem === "слоговая структура слова нарушена") {
        parts.push("слоговая структура слова - нарушена");
      }
    }
    
    // Кинетический артикуляционный праксис
    const kineticItem = data.motorRealization.find((item: string) => item.includes("кинетический артикуляционный праксис"));
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

  const formatConnectedSpeech = (connectedSpeech: string[]) => {
    if (connectedSpeech.includes("норма")) {
      return "норма";
    }
    
    if (!connectedSpeech.includes("нарушена")) {
      return connectedSpeech.join(", ");
    }
    
    // Формируем заключение для нарушенной связной речи
    const parts: string[] = [];
    
    // Проверяем бедность активного словаря
    if (connectedSpeech.includes("бедность активного словаря")) {
      const vocabularyParts = [];
      
      if (connectedSpeech.includes("номинативная функция сохранна")) {
        // Не добавляем ничего, так как функция сохранна
      } else {
        vocabularyParts.push("Объем активного словаря не соответствует возрастной норме");
        
        const paraphasiaTypes = [];
        if (connectedSpeech.includes("вербальные парафазии")) {
          paraphasiaTypes.push("вербальные парафазии");
        }
        if (connectedSpeech.includes("латеральные парафазии")) {
          paraphasiaTypes.push("латеральные парафазии");
        }
        if (connectedSpeech.includes("вербальные и латеральные парафазии")) {
          paraphasiaTypes.push("вербальные и латеральные парафазии");
        }
        
        if (paraphasiaTypes.length > 0) {
          vocabularyParts.push(`наблюдаются ${paraphasiaTypes.join(", ")}`);
        }
      }
      
      if (vocabularyParts.length > 0) {
        parts.push(vocabularyParts.join(", "));
      }
    }
    
    // Собираем описание нарушений при составлении рассказа
    const storyViolations = [];
    
    if (connectedSpeech.includes("смысловая неадекватность")) {
      storyViolations.push("нарушение логики передачи замысла");
    }
    
    if (connectedSpeech.includes("пропуск отдельных смысловых звеньев и/или связующих элементов")) {
      storyViolations.push("пропуск смысловых звеньев и связующих элементов");
    }
    
    if (connectedSpeech.includes("неоднократные необоснованные повторы слов и предложений")) {
      storyViolations.push("неоднократные необоснованные повторы");
    }
    
    if (connectedSpeech.includes("малая длина синтагм")) {
      storyViolations.push("малая длина синтагм, которая указывает на синтагматические трудности, т.е. функциональную недостаточность передних отделов коры");
    }
    
    if (connectedSpeech.includes("малая длина текста")) {
      storyViolations.push("малая длина текста, которая свидетельствует о трудностях смыслового программирования и грамматического структурирования");
    }
    
    if (connectedSpeech.includes("смысловая неточность")) {
      storyViolations.push("смысловая неточность");
    }
    
    if (storyViolations.length > 0) {
      parts.push(`При составлении рассказа по серии сюжетных картинок наблюдается ${storyViolations.join(", ")}`);
    }
    
    return parts.length > 0 ? `нарушена. ${parts.join(". ")}` : "нарушена";
  };

  // Проверяем, есть ли данные для отображения
  const hasData = diagData.motorRealization.length > 0 || 
                  diagData.wordFormation.length > 0 || 
                  diagData.grammaticalStructure || 
                  diagData.connectedSpeech.length > 0 || 
                  diagData.nominativeFunction.length > 0;

  if (!hasData) {
    return null;
  }

  return (
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
          <p><strong>Связная речь:</strong> {formatConnectedSpeech(diagData.connectedSpeech)}</p>
        )}
        {diagData.nominativeFunction.length > 0 && (
          <p><strong>Номинативная функция речи:</strong> {diagData.nominativeFunction.join(', ')}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpressiveSpeechSection;