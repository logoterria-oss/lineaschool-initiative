import { useNavigate } from "react-router-dom";
import type { DiagFormData } from "@/types/diagFormData";

export const useConclusionLogic = () => {
  const navigate = useNavigate();

  // Функция форматирования связной речи для заключения
  const formatConnectedSpeechForConclusion = (connectedSpeech: string[]) => {
    if (!connectedSpeech || connectedSpeech.length === 0 || connectedSpeech.includes("норма")) {
      return "";
    }
    
    if (!connectedSpeech.includes("нарушена")) {
      return "";
    }
    
    // Формируем заключение для нарушенной связной речи
    const parts: string[] = [];
    
    // Проверяем бедность активного словаря
    if (connectedSpeech.includes("бедность активного словаря")) {
      const vocabularyParts = [];
      
      if (!connectedSpeech.includes("номинативная функция сохранна")) {
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
    
    return parts.length > 0 ? `Связная речь: нарушена. ${parts.join(". ")}` : "";
  };

  // Функция генерации заключения
  const generateConclusion = (diagData: DiagFormData) => {
    try {
      const conclusionParts = [];
      
      // Добавляем связную речь в начало заключения, если она нарушена
      const connectedSpeechText = formatConnectedSpeechForConclusion(diagData.connectedSpeech || []);
      if (connectedSpeechText) {
        conclusionParts.push(connectedSpeechText);
      }
      
      if (diagData.speechDisorders && Array.isArray(diagData.speechDisorders) && diagData.speechDisorders.length > 0) {
        conclusionParts.push(diagData.speechDisorders.join(', '));
      }
      
      if (diagData.dyslexiaTypes && Array.isArray(diagData.dyslexiaTypes) && diagData.dyslexiaTypes.length > 0) {
        conclusionParts.push(diagData.dyslexiaTypes.join(', '));
      }
      
      if (diagData.dysgraphiaTypes && Array.isArray(diagData.dysgraphiaTypes) && diagData.dysgraphiaTypes.length > 0) {
        conclusionParts.push(diagData.dysgraphiaTypes.join(', '));
      }
      
      if (diagData.brainSyndromes && Array.isArray(diagData.brainSyndromes) && diagData.brainSyndromes.length > 0) {
        conclusionParts.push(diagData.brainSyndromes.join(', '));
      }
      
      const diagnosis = conclusionParts.length > 0 
        ? conclusionParts.join('. ')
        : 'Нарушения речевого развития';
      
      // Формируем рекомендации
      const recommendationsList = diagData.recommendations && diagData.recommendations.length > 0
        ? diagData.recommendations.join('; ')
        : 'Индивидуальные коррекционные занятия с логопедом; Развитие фонематического восприятия; Работа над звукопроизношением';
      
      // Создаем полный текст заключения
      const fullText = `ЛОГОПЕДИЧЕСКОЕ ЗАКЛЮЧЕНИЕ №${Math.floor(Date.now() / 1000)}

🎯 СОЗДАНО АВТОМАТИЧЕСКИ ИЗ ДИАГНОСТИЧЕСКОЙ ФОРМЫ /diag_form

Ребенок: ${diagData.childName}
Возраст: ${diagData.age} лет
Дата обследования: ${new Date().toLocaleDateString('ru-RU')}
Родитель/опекун: ${diagData.parentName}
Контакт: ${diagData.phone}${diagData.email ? ' | ' + diagData.email : ''}

РЕЗУЛЬТАТЫ АВТОМАТИЧЕСКОЙ ДИАГНОСТИКИ:
✅ Анализ ответов на диагностические вопросы
✅ Обработка данных ИИ-алгоритмом
✅ Формирование индивидуального заключения

ЗАКЛЮЧЕНИЕ: ${diagnosis}

РЕКОМЕНДАЦИИ:
${recommendationsList.split('; ').map(rec => `• ${rec}`).join('\n')}

💡 Данное заключение создано на основе диагностической формы и может требовать очной консультации специалиста для уточнения программы коррекции.`;
      
      return {
        diagnosis,
        recommendations: recommendationsList,
        fullText
      };
    } catch (error) {
      console.error('Ошибка формирования заключения:', error);
      return {
        diagnosis: 'Ошибка при формировании заключения',
        recommendations: 'Обратитесь к специалисту',
        fullText: 'Произошла ошибка при формировании заключения. Обратитесь к администратору.'
      };
    }
  };

  const handleCreateConclusion = async (formData: DiagFormData, event?: React.MouseEvent<HTMLButtonElement>) => {
    // Предотвращаем отправку формы
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('DiagForm: Creating conclusion...');
    
    try {
      // Проверяем, что у нас есть минимально необходимые данные
      if (!formData.childName || formData.childName.trim() === '') {
        alert('Пожалуйста, заполните имя ребенка');
        return;
      }
      
      // Устанавливаем дату диагноза, если не указана
      if (!formData.diagnosisDate) {
        formData.diagnosisDate = new Date().toISOString().split('T')[0];
      }
      
      // Сохраняем в localStorage для локального просмотра
      try {
        const dataToSave = JSON.stringify(formData);
        localStorage.setItem('diagData', dataToSave);
        console.log('Data saved to localStorage');
      } catch (localStorageError) {
        console.warn('localStorage недоступен:', localStorageError);
      }
      
      // Генерируем заключение на основе данных формы
      const conclusion = generateConclusion(formData);
      
      // Данные для сохранения полного заключения
      const fullReportData = {
        form_data: formData,
        student_name: formData.childName,
        date_of_examination: formData.diagnosisDate || new Date().toISOString().split('T')[0],
        student_age: parseInt(formData.age) || null,
        therapist_name: 'Логопед',
        diagnosis: '',
        recommendations: '',
        report_content: 'Логопедическое заключение'
      };
      
      console.log('🔄 Сохраняем полное заключение в базу данных...');
      
      try {
        // Сохраняем полное заключение в БД
        const saveResponse = await fetch('https://functions.poehali.dev/7bc33dbc-e8a0-47b4-83cc-d792dc7e1696', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fullReportData)
        });
        
        const saveResult = await saveResponse.json();
        console.log('📥 Ответ сервера:', saveResult);
        
        if (saveResponse.ok && saveResult.success) {
          // Успешно сохранили в БД
          const reportId = saveResult.id;
          console.log('✅ Заключение сохранено в базу данных с ID:', reportId);
          
          // Создаем ссылку на заключение
          const conclusionUrl = `${window.location.origin}/diag/${reportId}`;
          
          // Показываем пользователю информацию
          const message = `✅ Заключение создано!\n\n📋 Заключение №${reportId}\n🔗 Ссылка для просмотра: ${conclusionUrl}\n\n💡 Заключение сохранено в системе`;
          alert(message);
          
          // Копируем ссылку в буфер обмена
          try {
            await navigator.clipboard.writeText(conclusionUrl);
            console.log('Ссылка скопирована в буфер обмена');
          } catch (clipboardError) {
            console.warn('Не удалось скопировать в буфер обмена:', clipboardError);
          }
          
          // Переходим на страницу заключения
          console.log('Переходим к заключению:', `/diag/${reportId}`);
          navigate(`/diag/${reportId}`);
          return;
          
        } else {
          console.warn('⚠️ Не удалось сохранить заключение в БД:', saveResponse.status, saveResult);
          // Показываем предупреждение, но продолжаем работу локально
          throw new Error('Не удалось сохранить в базу данных');
        }
      } catch (saveError) {
        console.error('❌ Ошибка сохранения в базу данных:', saveError);
        
        // Fallback: работаем локально
        const localReportId = Math.floor(Math.random() * 10000) + 1;
        const conclusionUrl = `${window.location.origin}/diag/${localReportId}`;
        const message = `✅ Заключение создано!\n\n📋 Заключение №${localReportId}\n🔗 Ссылка: ${conclusionUrl}\n\n⚠️ Заключение сохранено только локально`;
        alert(message);
        
        try {
          await navigator.clipboard.writeText(conclusionUrl);
        } catch (clipboardError) {
          console.warn('Не удалось скопировать в буфер обмена:', clipboardError);
        }
        
        // Переходим на страницу заключения (локальная версия)
        console.log('Переходим к локальному заключению:', `/diag/${localReportId}`);
        navigate(`/diag/${localReportId}`);
      }
      
    } catch (error) {
      console.error('Error creating conclusion:', error);
      alert(`Произошла ошибка при создании заключения: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  return {
    handleCreateConclusion,
    generateConclusion,
    formatConnectedSpeechForConclusion
  };
};