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
    // Создаем временный div для рендеринга содержимого
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.padding = '0'; // Убираем padding, будем добавлять margin к страницам
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.fontSize = '11px';
    tempDiv.style.lineHeight = '1.4';
    tempDiv.style.color = 'black';
    tempDiv.style.boxSizing = 'border-box';

    tempDiv.innerHTML = await createPDFContent(diagData, serialNumber);
    
    document.body.appendChild(tempDiv);

    // Конвертируем в canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: tempDiv.scrollWidth,
      windowWidth: tempDiv.scrollWidth
    });

    // Создаем PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Получаем размеры изображения
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Добавляем изображение в PDF с отступами
    const imgData = canvas.toDataURL('image/png');
    const pageHeight = 297; // A4 height in mm
    const topMargin = 25; // 25mm сверху (как в Word)
    const bottomMargin = 25; // 25mm снизу
    const contentHeight = pageHeight - topMargin - bottomMargin; // 247mm для контента
    
    if (imgHeight <= contentHeight) {
      // Помещается на одну страницу
      pdf.addImage(imgData, 'PNG', 0, topMargin, imgWidth, imgHeight);
    } else {
      // Разбиваем на несколько страниц с отступами
      let position = 0;
      let pageNumber = 0;

      while (position < imgHeight) {
        if (pageNumber > 0) {
          pdf.addPage();
        }
        
        // Добавляем изображение со смещением вверх на position и отступом сверху
        pdf.addImage(imgData, 'PNG', 0, topMargin - position, imgWidth, imgHeight);
        
        position += contentHeight; // Переходим на следующую страницу с учетом контента
        pageNumber++;
      }
    }

    // Удаляем временный элемент
    document.body.removeChild(tempDiv);

    // Скачиваем PDF
    const fileName = `Логопедическое_заключение_${diagData.childName.replace(/\s+/g, '_')}_${serialNumber}.pdf`;
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

  const formatArray = (arr: string[] | string) => {
    if (Array.isArray(arr)) {
      return arr.filter(item => item && item.trim()).join(', ');
    }
    return arr || '';
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
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <tr>
            <td style="padding: 4px 8px; font-weight: bold; width: 35%;">Ф.И.О. ребенка:</td>
            <td style="padding: 4px 8px; border-bottom: 1px solid #ddd;">${diagData.childName || ''}</td>
          </tr>
          <tr>
            <td style="padding: 4px 8px; font-weight: bold;">Дата рождения:</td>
            <td style="padding: 4px 8px; border-bottom: 1px solid #ddd;">${formatDate(diagData.birthDate)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 8px; font-weight: bold;">Возраст:</td>
            <td style="padding: 4px 8px; border-bottom: 1px solid #ddd;">${diagData.age || ''} лет</td>
          </tr>
          <tr>
            <td style="padding: 4px 8px; font-weight: bold;">Класс/группа:</td>
            <td style="padding: 4px 8px; border-bottom: 1px solid #ddd;">${diagData.grade || ''}</td>
          </tr>
          <tr>
            <td style="padding: 4px 8px; font-weight: bold;">Ф.И.О. родителя:</td>
            <td style="padding: 4px 8px; border-bottom: 1px solid #ddd;">${diagData.parentName || ''}</td>
          </tr>
          <tr>
            <td style="padding: 4px 8px; font-weight: bold;">Телефон:</td>
            <td style="padding: 4px 8px; border-bottom: 1px solid #ddd;">${diagData.phone || ''}</td>
          </tr>
          ${diagData.email ? `
          <tr>
            <td style="padding: 4px 8px; font-weight: bold;">Email:</td>
            <td style="padding: 4px 8px; border-bottom: 1px solid #ddd;">${diagData.email}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- Анамнез -->
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 4px;">
          Анамнестические данные
        </h2>
        ${diagData.complaints ? `<div style="margin-bottom: 10px;"><strong>Жалобы:</strong> ${diagData.complaints}</div>` : ''}
        ${diagData.educationType ? `<div style="margin-bottom: 10px;"><strong>Тип обучения:</strong> ${diagData.educationType === 'school' ? 'Школа' : diagData.educationType === 'kindergarten' ? 'Детский сад' : diagData.educationType}</div>` : ''}
        ${diagData.aoop ? `<div style="margin-bottom: 10px;"><strong>АООП:</strong> ${diagData.aoop}</div>` : ''}
        ${diagData.prenatalDevelopment ? `<div style="margin-bottom: 10px;"><strong>Пренатальное развитие:</strong> ${diagData.prenatalDevelopment}</div>` : ''}
        ${diagData.neurologicalDisorders ? `<div style="margin-bottom: 10px;"><strong>Неврологические нарушения:</strong> ${diagData.neurologicalDisorders}</div>` : ''}
        ${diagData.hearingVisionDisorders ? `<div style="margin-bottom: 10px;"><strong>Нарушения слуха/зрения:</strong> ${diagData.hearingVisionDisorders}</div>` : ''}
        ${diagData.chronicDiseases ? `<div style="margin-bottom: 10px;"><strong>Хронические заболевания:</strong> ${diagData.chronicDiseases}</div>` : ''}
        ${diagData.speechEnvironment ? `<div style="margin-bottom: 10px;"><strong>Речевая среда:</strong> ${diagData.speechEnvironment}</div>` : ''}
        ${diagData.previousSpecialists && diagData.previousSpecialists.length > 0 ? `<div style="margin-bottom: 10px;"><strong>Консультации специалистов:</strong> ${formatArray(diagData.previousSpecialists)}</div>` : ''}
        ${diagData.dominantHand ? `<div style="margin-bottom: 10px;"><strong>Ведущая рука:</strong> ${diagData.dominantHand === 'right' ? 'Правая' : diagData.dominantHand === 'left' ? 'Левая' : 'Не определена'}</div>` : ''}
        ${diagData.additionalInfo ? `<div style="margin-bottom: 10px;"><strong>Дополнительная информация:</strong> ${diagData.additionalInfo}</div>` : ''}
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