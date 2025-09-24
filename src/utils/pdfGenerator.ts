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
    tempDiv.style.padding = '20mm';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.fontSize = '12px';
    tempDiv.style.lineHeight = '1.4';
    tempDiv.style.color = 'black';

    tempDiv.innerHTML = createPDFContent(diagData, serialNumber);
    
    document.body.appendChild(tempDiv);

    // Конвертируем в canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123 // A4 height in pixels at 96 DPI
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

    // Добавляем изображение в PDF
    const imgData = canvas.toDataURL('image/png');
    
    if (imgHeight <= 297) {
      // Помещается на одну страницу
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    } else {
      // Разбиваем на несколько страниц
      let position = 0;
      const pageHeight = 297; // A4 height in mm

      while (position < imgHeight) {
        if (position > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'PNG', 0, -position, imgWidth, imgHeight);
        position += pageHeight;
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

function createPDFContent(diagData: DiagData, serialNumber: string): string {
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

  return `
    <div style="max-width: 100%; font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.6;">
      <!-- Заголовок -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px;">
        <h1 style="font-size: 18px; font-weight: bold; margin: 0 0 10px 0; text-transform: uppercase;">
          ЛОГОПЕДИЧЕСКОЕ ЗАКЛЮЧЕНИЕ
        </h1>
        <p style="font-size: 14px; margin: 0; color: #666;">№ ${serialNumber}</p>
      </div>

      <!-- Персональные данные -->
      <div style="margin-bottom: 25px;">
        <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
          ПЕРСОНАЛЬНЫЕ ДАННЫЕ
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 10px; font-weight: bold; width: 40%;">Ф.И.О. ребенка:</td>
            <td style="padding: 5px 10px; border-bottom: 1px solid #ddd;">${diagData.childName || ''}</td>
          </tr>
          <tr>
            <td style="padding: 5px 10px; font-weight: bold;">Дата рождения:</td>
            <td style="padding: 5px 10px; border-bottom: 1px solid #ddd;">${formatDate(diagData.birthDate)}</td>
          </tr>
          <tr>
            <td style="padding: 5px 10px; font-weight: bold;">Возраст:</td>
            <td style="padding: 5px 10px; border-bottom: 1px solid #ddd;">${diagData.age || ''} лет</td>
          </tr>
          <tr>
            <td style="padding: 5px 10px; font-weight: bold;">Класс/группа:</td>
            <td style="padding: 5px 10px; border-bottom: 1px solid #ddd;">${diagData.grade || ''}</td>
          </tr>
          <tr>
            <td style="padding: 5px 10px; font-weight: bold;">Ф.И.О. родителя:</td>
            <td style="padding: 5px 10px; border-bottom: 1px solid #ddd;">${diagData.parentName || ''}</td>
          </tr>
          <tr>
            <td style="padding: 5px 10px; font-weight: bold;">Телефон:</td>
            <td style="padding: 5px 10px; border-bottom: 1px solid #ddd;">${diagData.phone || ''}</td>
          </tr>
          <tr>
            <td style="padding: 5px 10px; font-weight: bold;">Email:</td>
            <td style="padding: 5px 10px; border-bottom: 1px solid #ddd;">${diagData.email || ''}</td>
          </tr>
        </table>
      </div>

      <!-- Анамнез -->
      <div style="margin-bottom: 25px;">
        <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
          АНАМНЕСТИЧЕСКИЕ ДАННЫЕ
        </h2>
        <div style="margin-bottom: 15px;">
          <strong>Жалобы:</strong> ${diagData.complaints || 'Нет'}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Тип обучения:</strong> ${diagData.educationType === 'school' ? 'Школа' : diagData.educationType === 'kindergarten' ? 'Детский сад' : diagData.educationType || ''}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>АООП:</strong> ${diagData.aoop || 'Нет'}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Пренатальное развитие:</strong> ${diagData.prenatalDevelopment || ''}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Неврологические нарушения:</strong> ${diagData.neurologicalDisorders || ''}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Нарушения слуха/зрения:</strong> ${diagData.hearingVisionDisorders || ''}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Хронические заболевания:</strong> ${diagData.chronicDiseases || ''}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Речевая среда:</strong> ${diagData.speechEnvironment || ''}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Ведущая рука:</strong> ${diagData.dominantHand === 'right' ? 'Правая' : diagData.dominantHand === 'left' ? 'Левая' : 'Не определена'}
        </div>
      </div>

      <!-- Обследование речи -->
      <div style="margin-bottom: 25px;">
        <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
          ОБСЛЕДОВАНИЕ УСТНОЙ РЕЧИ
        </h2>
        <div style="margin-bottom: 15px;">
          <strong>Звукопроизношение и моторная реализация:</strong><br>
          ${formatArray(diagData.motorRealization)}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Словообразование:</strong><br>
          ${formatArray(diagData.wordFormation)}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Грамматический строй:</strong> ${diagData.grammaticalStructure || ''}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Связная речь:</strong><br>
          ${formatArray(diagData.connectedSpeech)}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Номинативная функция:</strong><br>
          ${formatArray(diagData.nominativeFunction)}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Понимание слов:</strong> ${diagData.wordUnderstanding || ''}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Сложные конструкции:</strong> ${diagData.complexConstructions || ''}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Фонематическое восприятие:</strong> ${diagData.phonematicPerception || ''}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Языковой анализ:</strong><br>
          ${formatArray(diagData.languageAnalysis)}
        </div>
      </div>

      <!-- Письменная речь -->
      <div style="margin-bottom: 25px;">
        <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
          ОБСЛЕДОВАНИЕ ПИСЬМЕННОЙ РЕЧИ
        </h2>
        <div style="margin-bottom: 15px;">
          <strong>Навык чтения:</strong><br>
          ${formatArray(diagData.readingSkill)}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Скорость чтения:</strong> ${diagData.readingSpeed || ''} слов/мин
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Понимание прочитанного:</strong> ${diagData.readingComprehension || ''}%
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Письменные работы:</strong> Представлены образцы письменных работ
        </div>
      </div>

      <!-- Дополнительная информация -->
      ${diagData.additionalInfo ? `
      <div style="margin-bottom: 25px;">
        <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
          ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ
        </h2>
        <div style="margin-bottom: 15px; text-align: justify;">
          ${diagData.additionalInfo}
        </div>
      </div>
      ` : ''}

      <!-- Подпись -->
      <div style="margin-top: 40px; border-top: 1px solid #333; padding-top: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: end;">
          <div style="width: 45%;">
            <div style="border-bottom: 1px solid #333; height: 30px; margin-bottom: 5px;"></div>
            <div style="font-size: 12px; text-align: center;">Подпись специалиста</div>
          </div>
          <div style="width: 45%;">
            <div style="border-bottom: 1px solid #333; height: 30px; margin-bottom: 5px;"></div>
            <div style="font-size: 12px; text-align: center;">Дата: ${new Date().toLocaleDateString('ru-RU')}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}