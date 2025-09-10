import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import DiagFormNavigation from "@/components/diag/DiagFormNavigation";
import PersonalDataSection from "@/components/diag/PersonalDataSection";
import AnamnesticsSection from "@/components/diag/AnamnesticsSection";
import ExpressiveSpeechSection from "@/components/diag/ExpressiveSpeechSection";
import ImpressiveSpeechSection from "@/components/diag/ImpressiveSpeechSection";
import WrittenSpeechSection from "@/components/diag/WrittenSpeechSection";
import ConclusionSection from "@/components/diag/ConclusionSection";
import FinalSection from "@/components/diag/FinalSection";
import { Button } from "@/components/ui/button";

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

  const handleCreateConclusion = () => {
    // Генерируем порядковый номер (в реальном приложении это должно быть из базы данных)
    const serialNumber = Math.floor(Math.random() * 10000) + 1;
    
    // Сохраняем данные формы в localStorage для передачи на страницу заключения
    localStorage.setItem('diagData', JSON.stringify(formData));
    
    // Переходим на страницу заключения
    navigate(`/diag_${serialNumber}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <DiagFormNavigation />

      <main className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Диагностическая форма</h1>
          
          <form className="space-y-8">
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

            <ImpressiveSpeechSection 
              formData={{
                wordUnderstanding: formData.wordUnderstanding,
                complexConstructions: formData.complexConstructions,
                phonematicPerception: formData.phonematicPerception
              }}
              onInputChange={handleInputChange}
            />

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

            <ConclusionSection 
              formData={{
                speechDisorders: formData.speechDisorders,
                dyslexiaTypes: formData.dyslexiaTypes,
                dysgraphiaTypes: formData.dysgraphiaTypes,
                brainSyndromes: formData.brainSyndromes
              }}
              onInputChange={handleInputChange}
            />

            <FinalSection 
              formData={{
                recommendations: formData.recommendations,
                workDirections: formData.workDirections,
                diagnosisDate: formData.diagnosisDate,
                logopedist: formData.logopedist
              }}
              onInputChange={handleInputChange}
            />

            <div className="flex justify-center mt-8">
              <Button 
                type="button"
                onClick={handleCreateConclusion}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg"
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