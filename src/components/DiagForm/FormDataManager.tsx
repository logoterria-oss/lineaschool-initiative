import { useState } from "react";
import type { DiagFormData } from "@/types/diagFormData";

export const useFormDataManager = () => {
  const [formData, setFormData] = useState<DiagFormData>({
    childName: "",
    birthDate: "",
    age: "",
    grade: "",
    parentName: "",
    phone: "",
    email: "",
    city: "",
    cityRegion: "",
    complaints: "",
    educationType: "",
    aoop: "",
    schoolStartAge: "",
    kindergarten: "",
    // Анамнестические данные
    prenatalDevelopment: "нет",
    prenatalDevelopmentCustom: "",
    earlyDevelopment: "нет",
    earlyDevelopmentCustom: "",
    neurologicalDisorders: "нет",
    neurologicalDisordersCustom: "",
    hearingVisionDisorders: "нет",
    hearingVisionDisordersCustom: "",
    chronicDiseases: "нет",
    chronicDiseasesCustom: "",
    speechEnvironment: "нет",
    speechEnvironmentCustom: "",
    previousSpecialists: [] as string[],
    speechTherapistConclusion: "",
    defectologistConclusion: "",
    neuropsychologistConclusion: "",
    dominantHand: "",
    additionalInfo: "",
    // Экспрессивная речь
    motorRealization: [] as string[],
    motorRealizationMultiple: "",
    motorRealizationOther: "",
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
    dictationWords: "",
    dysgraphicErrors: "",
    dysorthographicErrors: "",
    totalErrors: "",
    analysisErrors: [] as string[],
    acousticErrors: [] as string[],
    motorErrors: [] as string[],
    visualMotorErrors: [] as string[],
    visualSpatialErrors: [] as string[],
    additionalCharacteristics: [] as string[],
    regulationViolations: [] as string[],
    regulationViolationsOther: "",
    orthographicErrorTypes: [] as string[],
    orthographicErrorsOther: "",
    // Заключение
    speechDisorders: [] as string[],
    soundProductionType: "",
    languageAnalysisTypes: [] as string[],
    dyslexiaTypes: [] as string[],
    dysgraphiaTypes: [] as string[],
    brainSyndromes: [] as string[],
    normaDevelopment: false,
    // Финальные поля
    recommendations: [] as string[],
    workDirections: [] as string[],
    diagnosisDate: "",
    logopedist: ""
  });

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return {
    formData,
    handleInputChange
  };
};