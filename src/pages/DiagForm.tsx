import { useState } from "react";
import Footer from "@/components/Footer";
import DiagFormNavigation from "@/components/diag/DiagFormNavigation";
import PersonalDataSection from "@/components/diag/PersonalDataSection";
import AnamnesticsSection from "@/components/diag/AnamnesticsSection";
import ExpressiveSpeechSection from "@/components/diag/ExpressiveSpeechSection";

export default function DiagForm() {
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
    nominativeFunction: [] as string[]
  });

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}