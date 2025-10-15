import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  neurologicalDisorders: string;
  hearingVisionDisorders: string;
  chronicDiseases: string;
  speechEnvironment: string;
  previousSpecialists: string[];
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
  [key: string]: any;
}

export async function generatePDF(diagData: DiagData, serialNumber: string): Promise<void> {
  try {
    // Находим элемент страницы
    const element = document.querySelector('.print-page') as HTMLElement;
    if (!element) {
      throw new Error('Элемент для печати не найден');
    }

    // Клонируем для модификации
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Показываем скрытые элементы для печати
    const hiddenElements = clone.querySelectorAll('.hidden');
    hiddenElements.forEach(el => {
      (el as HTMLElement).classList.remove('hidden');
      (el as HTMLElement).style.display = 'block';
    });

    // Временно добавляем в DOM
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.width = '794px'; // A4 width при 96 DPI
    clone.style.padding = '0';
    clone.style.background = 'white';
    document.body.appendChild(clone);

    // Генерируем canvas
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Удаляем клон
    document.body.removeChild(clone);

    // Создаем PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width
    const pageHeight = 297; // A4 height
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // Первая страница
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Дополнительные страницы
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Сохраняем файл
    const fileName = `Заключение_${serialNumber}_${diagData.lastName || diagData.childName?.split(' ')[0] || 'пациент'}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Ошибка генерации PDF:', error);
    throw error;
  }
}

async function createPDFContent(diagData: DiagData, serialNumber: string): Promise<string> {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [day, month, year] = dateStr.split('.');
      return `${day}.${month}.${year}`;
    } catch {
      return dateStr;
    }
  };

  // Функции форматирования как в diagUtils.ts
  const translateValue = (value: string) => {
    if (!value) return 'Не указано';
    
    const translations: Record<string, string> = {
      'в образовательной организации (школа, лицей, гимназия)': 'в общеобразовательной школе',
      'в образовательной организации (коррекционная школа)': 'в специальной (коррекционной) школе',
      'семейное образование': 'семейное образование',
      'school': 'в общеобразовательной школе',
      'general': 'в общеобразовательной школе',
      'right': 'правша',
      'left': 'левша',
      'retrained': 'правша (переученный левша)',
      'ambidextrous': 'обе руки',
      'attended': 'Посещал',
      'not_attended': 'Не посещал',
      'aoop_1': 'АООП НОО ОВЗ вариант 1',
      'aoop_2': 'АООП НОО ОВЗ вариант 2',
      'none': 'Не требуется',
      'yes': 'Да',
      'no': 'Нет',
      'нет /не диагностировано': 'нет /не диагностировано',
      'не диагностировано': 'нет /не диагностировано'
    };
    
    return translations[value] || value;
  };

  const formatList = (items: string[] | string) => {
    if (!items) return 'Не указано';
    if (!Array.isArray(items)) return translateValue(items) || 'Не указано';
    return items.length > 0 ? items.map(translateValue).join(', ') : 'Не указано';
  };

  const formatValue = (value: string | string[]) => {
    if (!value) return 'Не указано';
    if (Array.isArray(value)) {
      return formatList(value);
    }
    return translateValue(value) || 'Не указано';
  };

  const formatAnamnesticsValue = (value: string | string[], isCustom: boolean, customValue?: string, fieldType?: string) => {
    if (isCustom) {
      return customValue || 'Не указано';
    }
    
    if (!value) return 'Не указано';
    
    if (value === 'нет') {
      if (fieldType === 'prenatal' || fieldType === 'speech') {
        return 'без особенностей';
      }
      return 'нет /не диагностировано';
    }
    
    if (value === 'нет /не диагностировано' || value === 'не диагностировано') {
      return 'нет /не диагностировано';
    }
    
    if (Array.isArray(value)) {
      return formatList(value);
    }
    
    return translateValue(value) || 'Не указано';
  };

  const formatArray = (arr: string[] | string) => {
    return formatList(arr);
  };

  // Функция для форматирования моторной реализации
  const formatMotorRealization = (data: any) => {
    const parts: string[] = [];
    
    const soundFirst = data.motorRealization?.[0];
    if (soundFirst === "норма") {
      parts.push("звукопроизношение - норма");
    } else if (soundFirst === "нарушена одна группа звуков") {
      const soundGroups = data.motorRealization?.slice(1).filter((item: string) => 
        ["свистящие", "шипящие", "аффрикаты", "Л-Ль", "Р-Рь"].includes(item)
      );
      const otherGroup = data.motorRealizationOther;
      
      let groupText = "";
      if (soundGroups && soundGroups.length > 0) {
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
    
    const syllableItem = data.motorRealization?.find((item: string) => item.includes("слоговая структура слова"));
    if (syllableItem) {
      parts.push(syllableItem);
    }
    
    const kineticItem = data.motorRealization?.find((item: string) => item.includes("кинетический артикуляционный праксис"));
    if (kineticItem) {
      parts.push(kineticItem);
    }
    
    return parts.join(", ") || 'Не указано';
  };

  // Функция для форматирования связной речи
  const formatConnectedSpeech = (data: any) => {
    if (!data.connectedSpeech || data.connectedSpeech.length === 0) {
      return "не оценивалась";
    }

    const connectedSpeech = Array.isArray(data.connectedSpeech) ? data.connectedSpeech : [data.connectedSpeech];
    
    if (connectedSpeech.some((item: string) => item === "норма")) {
      return "норма";
    }
    
    if (connectedSpeech.some((item: string) => item === "нарушена")) {
      const details: string[] = [];
      
      if (connectedSpeech.some((item: string) => item === "бедность активного словаря")) {
        details.push("Объем активного словаря не соответствует возрастной норме");
      }
      if (connectedSpeech.some((item: string) => item === "объем активного словаря не соответствует возрастной норме")) {
        details.push("Объем активного словаря не соответствует возрастной норме");
      }
      
      if (connectedSpeech.some((item: string) => item === "наблюдаются вербальные парафазии")) {
        details.push("наблюдаются вербальные парафазии");
      }
      
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
        storyProblems.push("малая длина синтагм");
      }
      if (connectedSpeech.some((item: string) => item === "малая длина текста")) {
        storyProblems.push("малая длина текста");
      }
      
      if (storyProblems.length > 0) {
        details.push(`При составлении рассказа: ${storyProblems.join(", ")}`);
      }
      
      return `нарушена. ${details.join(". ")}`;
    }
    
    return formatArray(connectedSpeech);
  };

  // Форматируем изображения письменных работ
  let writingSamplesHTML = '';
  if (diagData.writingSamples && diagData.writingSamples.length > 0) {
    const imagePromises = diagData.writingSamples.map(async (sample: string) => {
      const src = sample.startsWith('data:') ? sample : `data:image/jpeg;base64,${sample}`;
      return `
        <div style="margin: 15px 0; page-break-inside: avoid;">
          <img src="${src}" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; display: block; margin: 0 auto;" />
          <p style="text-align: center; font-size: 11px; color: #666; margin-top: 5px;">Образец письменной работы</p>
        </div>
      `;
    });
    const images = await Promise.all(imagePromises);
    writingSamplesHTML = images.join('');
  }

  return `
    <div style="max-width: 100%; font-family: 'Times New Roman', serif; font-size: 11px; line-height: 1.5; padding: 25mm 20mm; box-sizing: border-box;">
      <!-- Лого школы как в шапке сайта -->
      <div style="margin-bottom: 25px; display: flex; align-items: center; gap: 10px;">
        <div style="width: 50px; height: 50px; background-color: #22c55e; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        </div>
        <span style="font-size: 28px; font-weight: bold; color: #22c55e; font-family: Arial, sans-serif;">LineaSchool</span>
      </div>

      <!-- Заголовок -->
      <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #333; padding-bottom: 12px;">
        <h1 style="font-size: 16px; font-weight: bold; margin: 0 0 8px 0; text-transform: uppercase;">
          ЛОГОПЕДИЧЕСКОЕ ЗАКЛЮЧЕНИЕ
        </h1>
        <p style="font-size: 12px; margin: 0; color: #666;">№ ${serialNumber}</p>
      </div>

      <!-- Персональные данные -->
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">
          Персональные данные
        </h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
          <div><strong>ФИО ребенка:</strong> ${diagData.childName || 'Не указано'}</div>
          <div><strong>Дата рождения:</strong> ${diagData.birthDate || 'Не указано'}</div>
          <div><strong>Возраст:</strong> ${diagData.age || 'Не указано'}</div>
          <div><strong>Класс:</strong> ${diagData.grade || 'Не указано'}</div>
          <div><strong>ФИО родителя:</strong> ${diagData.parentName || 'Не указано'}</div>
          <div><strong>Телефон:</strong> ${diagData.phone || 'Не указано'}</div>
          <div><strong>Email:</strong> ${diagData.email || 'Не указано'}</div>
          <div><strong>Тип образования:</strong> ${formatValue(diagData.educationType)}</div>
          <div><strong>АООП:</strong> ${formatValue(diagData.aoop)}</div>
          <div><strong>Возраст поступления в школу:</strong> ${diagData.schoolStartAge || 'Не указано'}</div>
          <div><strong>Детский сад:</strong> ${formatValue(diagData.kindergarten)}</div>
        </div>
        ${diagData.complaints ? `<div style="margin-top: 10px;"><strong>Жалобы:</strong> "${diagData.complaints}"</div>` : ''}
      </div>

      <!-- Анамнез -->
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">
          Анамнестические данные
        </h2>
        <div style="font-size: 11px;">
          <div style="margin-bottom: 8px;"><strong>Пренатальное развитие:</strong> ${formatAnamnesticsValue(diagData.prenatalDevelopment, diagData.prenatalDevelopment === "custom", diagData.prenatalDevelopmentCustom, "prenatal")}</div>
          <div style="margin-bottom: 8px;"><strong>Неврологические нарушения:</strong> ${formatAnamnesticsValue(diagData.neurologicalDisorders, diagData.neurologicalDisorders === "custom", diagData.neurologicalDisordersCustom, "neurological")}</div>
          <div style="margin-bottom: 8px;"><strong>Нарушения слуха/зрения:</strong> ${formatAnamnesticsValue(diagData.hearingVisionDisorders, diagData.hearingVisionDisorders === "custom", diagData.hearingVisionDisordersCustom, "hearing")}</div>
          <div style="margin-bottom: 8px;"><strong>Хронические заболевания:</strong> ${formatAnamnesticsValue(diagData.chronicDiseases, diagData.chronicDiseases === "custom", diagData.chronicDiseasesCustom, "chronic")}</div>
          <div style="margin-bottom: 8px;"><strong>Речевая среда:</strong> ${formatAnamnesticsValue(diagData.speechEnvironment, diagData.speechEnvironment === "custom", diagData.speechEnvironmentCustom, "speech")}</div>
          <div style="margin-bottom: 8px;"><strong>Ведущая рука:</strong> ${formatValue(diagData.dominantHand)}</div>
          <div style="margin-bottom: 8px;"><strong>Занимался ли ребёнок ранее с коррекционными педагогами и/или психологами?</strong> ${formatList(diagData.previousSpecialists)}</div>
          ${diagData.speechTherapistConclusion ? `<div style="margin-bottom: 8px;"><strong>Заключение логопеда:</strong> ${diagData.speechTherapistConclusion}</div>` : ''}
          ${diagData.defectologistConclusion ? `<div style="margin-bottom: 8px;"><strong>Заключение дефектолога:</strong> ${diagData.defectologistConclusion}</div>` : ''}
          ${diagData.neuropsychologistConclusion ? `<div style="margin-bottom: 8px;"><strong>Заключение нейропсихолога:</strong> ${diagData.neuropsychologistConclusion}</div>` : ''}
          ${diagData.additionalInfo ? `<div style="margin-bottom: 8px;"><strong>Дополнительная информация:</strong> ${diagData.additionalInfo}</div>` : ''}
        </div>
      </div>

      <!-- Импрессивная речь -->
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">
          Импрессивная речь (понимание речи)
        </h2>
        ${diagData.wordUnderstanding ? `<div style="margin-bottom: 8px;"><strong>Понимание слов, обозначающих названия предметов и действий:</strong> ${diagData.wordUnderstanding}</div>` : ''}
        ${diagData.complexConstructions ? `<div style="margin-bottom: 8px;"><strong>Понимание сложных логико-грамматических конструкций:</strong> ${diagData.complexConstructions}</div>` : ''}
        ${diagData.phonematicPerception ? `<div style="margin-bottom: 8px;"><strong>Фонематическое восприятие:</strong> ${diagData.phonematicPerception.replace(/\s*\([^)]*\)/g, '')}</div>` : ''}
      </div>

      <!-- Экспрессивная речь -->
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">
          Экспрессивная речь (воспроизведение речи)
        </h2>
        <div style="margin-bottom: 8px;"><strong>Моторная реализация высказывания:</strong> ${formatMotorRealization(diagData)}</div>
        ${diagData.grammaticalStructure ? `<div style="margin-bottom: 8px;"><strong>Грамматический строй речи:</strong> ${diagData.grammaticalStructure}</div>` : ''}
        <div style="margin-bottom: 8px;"><strong>Связная речь:</strong> ${formatConnectedSpeech(diagData)}</div>
      </div>

      <!-- Письменная речь -->
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">
          Письменная речь
        </h2>
        ${diagData.languageAnalysis && diagData.languageAnalysis.length > 0 ? `<div style="margin-bottom: 8px;"><strong>Языковой анализ:</strong> ${formatArray(diagData.languageAnalysis)}</div>` : ''}
        ${diagData.readingSkill && diagData.readingSkill.length > 0 ? `<div style="margin-bottom: 8px;"><strong>Навык чтения:</strong> ${formatArray(diagData.readingSkill)}</div>` : ''}
        ${diagData.readingSpeed ? `<div style="margin-bottom: 8px;"><strong>Скорость чтения:</strong> ${diagData.readingSpeed} слов/мин</div>` : ''}
        ${diagData.readingComprehension ? `<div style="margin-bottom: 8px;"><strong>Понимание прочитанного:</strong> ${diagData.readingComprehension}%</div>` : ''}
        
        <!-- Образцы письменных работ -->
        ${writingSamplesHTML ? `
        <div style="margin-top: 15px;">
          <strong>Примеры письменных работ:</strong>
          ${writingSamplesHTML}
        </div>
        ` : ''}
        
        ${diagData.dysgraphicErrors ? `<div style="margin-bottom: 8px; margin-top: 10px;"><strong>Дисграфические ошибки:</strong> ${diagData.dysgraphicErrors}</div>` : ''}
        ${diagData.analysisErrors && diagData.analysisErrors.length > 0 ? `<div style="margin-bottom: 8px;"><strong>Ошибки анализа:</strong> ${formatArray(diagData.analysisErrors)}</div>` : ''}
        ${diagData.acousticErrors && diagData.acousticErrors.length > 0 ? `<div style="margin-bottom: 8px;"><strong>Акустические ошибки:</strong> ${formatArray(diagData.acousticErrors)}</div>` : ''}
        ${diagData.motorErrors && diagData.motorErrors.length > 0 ? `<div style="margin-bottom: 8px;"><strong>Моторные ошибки:</strong> ${formatArray(diagData.motorErrors)}</div>` : ''}
        ${diagData.visualMotorErrors && diagData.visualMotorErrors.length > 0 ? `<div style="margin-bottom: 8px;"><strong>Зрительно-моторные ошибки:</strong> ${formatArray(diagData.visualMotorErrors)}</div>` : ''}
        ${diagData.visualSpatialErrors && diagData.visualSpatialErrors.length > 0 ? `<div style="margin-bottom: 8px;"><strong>Зрительно-пространственные ошибки:</strong> ${formatArray(diagData.visualSpatialErrors)}</div>` : ''}
        ${diagData.additionalCharacteristics && diagData.additionalCharacteristics.length > 0 ? `<div style="margin-bottom: 8px;"><strong>Дополнительные характеристики:</strong> ${formatArray(diagData.additionalCharacteristics)}</div>` : ''}
        ${diagData.regulationViolations && diagData.regulationViolations.length > 0 ? `<div style="margin-bottom: 8px;"><strong>Нарушения регуляции:</strong> ${formatArray(diagData.regulationViolations)}</div>` : ''}
      </div>

      <!-- Заключение -->
      ${diagData.speechDisorders || diagData.dyslexiaTypes || diagData.dysgraphiaTypes || diagData.brainSyndromes ? `
      <div style="margin-bottom: 20px; padding: 12px; background-color: #f8f9fa; border-radius: 4px; border-left: 4px solid #3b82f6;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #3b82f6;">
          Заключение
        </h2>
        <div style="font-size: 12px; line-height: 1.6;">
          ${diagData.speechDisorders && diagData.speechDisorders.length > 0 ? `<div style="margin-bottom: 8px;">${formatArray(diagData.speechDisorders)}</div>` : ''}
          ${diagData.dyslexiaTypes && diagData.dyslexiaTypes.length > 0 ? `<div style="margin-bottom: 8px;">${formatArray(diagData.dyslexiaTypes)}</div>` : ''}
          ${diagData.dysgraphiaTypes && diagData.dysgraphiaTypes.length > 0 ? `<div style="margin-bottom: 8px;">${formatArray(diagData.dysgraphiaTypes)}</div>` : ''}
          ${diagData.brainSyndromes && diagData.brainSyndromes.length > 0 ? `<div style="margin-bottom: 8px;">${formatArray(diagData.brainSyndromes)}</div>` : ''}
        </div>
      </div>
      ` : ''}

      <!-- Рекомендации -->
      ${diagData.recommendations && diagData.recommendations.length > 0 ? `
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">
          Рекомендации
        </h2>
        <ul style="margin: 0; padding-left: 20px; list-style-type: disc;">
          ${diagData.recommendations.map((rec: string) => `<li style="margin-bottom: 6px;">${rec}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      <!-- Подпись -->
      <div style="margin-top: 40px; padding-top: 20px;">
        <table style="width: 100%;">
          <tr>
            <td style="width: 48%; vertical-align: bottom;">
              <div style="border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 5px; min-height: 20px; text-align: center;">
                ${diagData.logopedist || 'Логопед-диагност'}
              </div>
              <div style="font-size: 10px; text-align: center; color: #666;">Подпись специалиста</div>
            </td>
            <td style="width: 4%;"></td>
            <td style="width: 48%; vertical-align: bottom;">
              <div style="border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 5px; min-height: 20px; text-align: center;">
                ${diagData.diagnosisDate ? new Date(diagData.diagnosisDate).toLocaleDateString('ru-RU') : new Date().toLocaleDateString('ru-RU')}
              </div>
              <div style="font-size: 10px; text-align: center; color: #666;">Дата</div>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;
}