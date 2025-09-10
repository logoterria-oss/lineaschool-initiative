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

  const handleCreateConclusion = (event?: React.MouseEvent<HTMLButtonElement>) => {
    // Предотвращаем отправку формы
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('DiagForm: Creating conclusion...');
    console.log('Form data keys:', Object.keys(formData));
    console.log('Child name:', formData.childName);
    console.log('User Agent:', navigator.userAgent);
    console.log('localStorage available:', typeof Storage !== "undefined");
    
    try {
      // Проверяем доступность localStorage
      if (typeof Storage === "undefined") {
        throw new Error('localStorage не поддерживается в этом браузере');
      }

      // Тестируем localStorage перед использованием
      try {
        const testKey = 'test_key';
        const testValue = 'test_value';
        localStorage.setItem(testKey, testValue);
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        if (retrieved !== testValue) {
          throw new Error('localStorage не работает корректно');
        }
      } catch (storageError) {
        throw new Error('localStorage заблокирован (возможно, приватный режим браузера)');
      }

      // Проверяем, что у нас есть минимально необходимые данные
      if (!formData.childName || formData.childName.trim() === '') {
        alert('Пожалуйста, заполните имя ребенка');
        return;
      }
      
      // Генерируем порядковый номер
      const serialNumber = Math.floor(Math.random() * 10000) + 1;
      console.log('Generated serial number:', serialNumber);
      
      // Создаем строку для сохранения
      const dataToSave = JSON.stringify(formData);
      console.log('Data to save length:', dataToSave.length);
      console.log('First 100 chars:', dataToSave.substring(0, 100));
      
      // Пытаемся сохранить данные
      localStorage.setItem('diagData', dataToSave);
      
      // Проверяем, что данные действительно сохранились
      const savedData = localStorage.getItem('diagData');
      if (!savedData) {
        throw new Error('Данные не сохранились в localStorage');
      }
      
      console.log('Data successfully saved to localStorage');
      console.log('Saved data length:', savedData.length);
      
      // Переходим на страницу заключения
      console.log('Navigating to:', `/diag/${serialNumber}`);
      navigate(`/diag/${serialNumber}`);
      
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