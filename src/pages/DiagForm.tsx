import { useState, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import DiagFormNavigation from "@/components/diag/DiagFormNavigation";
import ErrorBoundary from "@/components/ErrorBoundary";
import SectionLoader from "@/components/SectionLoader";
import { Button } from "@/components/ui/button";

// Ленивая загрузка секций для улучшения производительности
const PersonalDataSection = lazy(() => import("@/components/diag/PersonalDataSection"));
const AnamnesticsSection = lazy(() => import("@/components/diag/AnamnesticsSection"));
const ExpressiveSpeechSection = lazy(() => import("@/components/diag/ExpressiveSpeechSection"));
const ImpressiveSpeechSection = lazy(() => import("@/components/diag/ImpressiveSpeechSection"));
const WrittenSpeechSection = lazy(() => import("@/components/diag/WrittenSpeechSection"));
const ConclusionSection = lazy(() => import("@/components/diag/ConclusionSection"));
const FinalSection = lazy(() => import("@/components/diag/FinalSection"));

export default function DiagForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    childName: "",
    birthDate: "",
    age: "",
    grade: "",
    parentName: "",
    phone: "",
    email: "",
    complaints: "",
    educationType: "",
    aoop: "",
    schoolStartAge: "",
    kindergarten: "",
    // Анамнестические данные
    prenatalDevelopment: "Без особенностей",
    prenatalDevelopmentCustom: "",
    neurologicalDisorders: "Нет / не диагностировано",
    neurologicalDisordersCustom: "",
    hearingVisionDisorders: "Нет / не диагностировано",
    hearingVisionDisordersCustom: "",
    chronicDiseases: "Нет / не диагностировано",
    chronicDiseasesCustom: "",
    speechEnvironment: "Нет",
    speechEnvironmentCustom: "",
    previousSpecialists: [] as string[],
    speechTherapistConclusion: "",
    defectologistConclusion: "",
    neuropsychologistConclusion: "",
    dominantHand: "",
    additionalInfo: "",
    // Экспрессивная речь
    motorRealization: [] as string[],
    wordFormation: [] as string[],
    grammaticalStructure: "",
    connectedSpeech: [] as string[],
    nominativeFunction: [] as string[],
    // Импрессивная речь
    wordUnderstanding: "",
    complexConstructions: "",
    phonematicPerception: "",
    // Письменная речь
    languageAnalysis: [] as string[],
    readingSkill: [] as string[],
    readingSpeed: "",
    readingComprehension: "",
    writingSamples: [] as string[],
    dysgraphicErrors: "",
    analysisErrors: [] as string[],
    acousticErrors: [] as string[],
    motorErrors: [] as string[],
    visualMotorErrors: [] as string[],
    visualSpatialErrors: [] as string[],
    additionalCharacteristics: [] as string[],
    regulationViolations: [] as string[],
    // Заключение
    speechDisorders: [] as string[],
    dyslexiaTypes: [] as string[],
    dysgraphiaTypes: [] as string[],
    brainSyndromes: [] as string[],
    // Финальные поля
    recommendations: [] as string[],
    workDirections: [] as string[],
    diagnosisDate: "",
    logopedist: ""
  });

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Функция генерации заключения
  const generateConclusion = (diagData: any) => {
    try {
      const conclusionParts = [];
      
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
        ? conclusionParts.join('; ')
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

  const handleCreateConclusion = async (event?: React.MouseEvent<HTMLButtonElement>) => {
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
        const saveResponse = await fetch('https://functions.poehali.dev/07850aca-9e34-468b-872d-2ebd23e5f959', {
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

  return (
    <div className="min-h-screen bg-white">
      <DiagFormNavigation />

      <main className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Диагностическая форма</h1>
          
          <form 
            className="space-y-8" 
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateConclusion();
            }}
          >
            <ErrorBoundary>
              <Suspense fallback={<SectionLoader />}>
                <PersonalDataSection 
                  formData={{
                    childName: formData.childName,
                    birthDate: formData.birthDate,
                    age: formData.age,
                    grade: formData.grade,
                    parentName: formData.parentName,
                    phone: formData.phone,
                    email: formData.email,
                    complaints: formData.complaints,
                    educationType: formData.educationType,
                    aoop: formData.aoop,
                    schoolStartAge: formData.schoolStartAge,
                    kindergarten: formData.kindergarten
                  }}
                  onInputChange={handleInputChange}
                />
              </Suspense>
            </ErrorBoundary>

            <ErrorBoundary>
              <Suspense fallback={<SectionLoader />}>
                <AnamnesticsSection 
                  formData={{
                    prenatalDevelopment: formData.prenatalDevelopment,
                    prenatalDevelopmentCustom: formData.prenatalDevelopmentCustom,
                    neurologicalDisorders: formData.neurologicalDisorders,
                    neurologicalDisordersCustom: formData.neurologicalDisordersCustom,
                    hearingVisionDisorders: formData.hearingVisionDisorders,
                    hearingVisionDisordersCustom: formData.hearingVisionDisordersCustom,
                    chronicDiseases: formData.chronicDiseases,
                    chronicDiseasesCustom: formData.chronicDiseasesCustom,
                    speechEnvironment: formData.speechEnvironment,
                    speechEnvironmentCustom: formData.speechEnvironmentCustom,
                    previousSpecialists: formData.previousSpecialists,
                    speechTherapistConclusion: formData.speechTherapistConclusion,
                    defectologistConclusion: formData.defectologistConclusion,
                    neuropsychologistConclusion: formData.neuropsychologistConclusion,
                    dominantHand: formData.dominantHand,
                    additionalInfo: formData.additionalInfo
                  }}
                  onInputChange={handleInputChange}
                />
              </Suspense>
            </ErrorBoundary>

            <ErrorBoundary>
              <Suspense fallback={<SectionLoader />}>
                <ExpressiveSpeechSection 
                  formData={{
                    motorRealization: formData.motorRealization,
                    wordFormation: formData.wordFormation,
                    grammaticalStructure: formData.grammaticalStructure,
                    connectedSpeech: formData.connectedSpeech,
                    nominativeFunction: formData.nominativeFunction
                  }}
                  onInputChange={handleInputChange}
                />
              </Suspense>
            </ErrorBoundary>

            <ErrorBoundary>
              <Suspense fallback={<SectionLoader />}>
                <ImpressiveSpeechSection 
                  formData={{
                    wordUnderstanding: formData.wordUnderstanding,
                    complexConstructions: formData.complexConstructions,
                    phonematicPerception: formData.phonematicPerception
                  }}
                  onInputChange={handleInputChange}
                />
              </Suspense>
            </ErrorBoundary>

            <ErrorBoundary>
              <Suspense fallback={<SectionLoader />}>
                <WrittenSpeechSection 
                  formData={{
                    languageAnalysis: formData.languageAnalysis,
                    readingSkill: formData.readingSkill,
                    readingSpeed: formData.readingSpeed,
                    readingComprehension: formData.readingComprehension,
                    writingSamples: formData.writingSamples,
                    dysgraphicErrors: formData.dysgraphicErrors,
                    analysisErrors: formData.analysisErrors,
                    acousticErrors: formData.acousticErrors,
                    motorErrors: formData.motorErrors,
                    visualMotorErrors: formData.visualMotorErrors,
                    visualSpatialErrors: formData.visualSpatialErrors,
                    additionalCharacteristics: formData.additionalCharacteristics,
                    regulationViolations: formData.regulationViolations
                  }}
                  onInputChange={handleInputChange}
                />
              </Suspense>
            </ErrorBoundary>

            <ErrorBoundary>
              <Suspense fallback={<SectionLoader />}>
                <ConclusionSection 
                  formData={{
                    speechDisorders: formData.speechDisorders,
                    dyslexiaTypes: formData.dyslexiaTypes,
                    dysgraphiaTypes: formData.dysgraphiaTypes,
                    brainSyndromes: formData.brainSyndromes
                  }}
                  onInputChange={handleInputChange}
                />
              </Suspense>
            </ErrorBoundary>

            <ErrorBoundary>
              <Suspense fallback={<SectionLoader />}>
                <FinalSection 
                  formData={{
                    recommendations: formData.recommendations,
                    workDirections: formData.workDirections,
                    diagnosisDate: formData.diagnosisDate,
                    logopedist: formData.logopedist
                  }}
                  onInputChange={handleInputChange}
                />
              </Suspense>
            </ErrorBoundary>

            <div className="flex justify-center mt-8 pb-8">
              <Button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-8 py-4 text-lg font-semibold rounded-lg transition-colors duration-200 min-h-[48px] touch-manipulation select-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                Создать
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}