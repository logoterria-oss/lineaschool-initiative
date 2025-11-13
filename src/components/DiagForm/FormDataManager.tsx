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
    complaints: "",
    educationType: "",
    aoop: "",
    schoolStartAge: "",
    kindergarten: "",
    // Анамнестические данные
    prenatalDevelopment: "нет",
    prenatalDevelopmentCustom: "",
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

  return {
    formData,
    handleInputChange
  };
};