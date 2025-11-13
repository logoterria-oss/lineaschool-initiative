import { useState, useEffect } from "react";
import type { DiagFormData } from "@/types/diagFormData";
import { toast } from '@/hooks/use-toast';

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

  useEffect(() => {
    const dictationDataStr = localStorage.getItem('dictation_to_form');
    if (dictationDataStr) {
      try {
        const dictationData = JSON.parse(dictationDataStr);
        const { childName, greenCount, redCount, annotatedImage } = dictationData;

        const nameParts = (childName || '').trim().split(' ');
        const lastName = nameParts[0] || '';
        const firstName = nameParts[1] || '';
        const fullName = `${lastName} ${firstName}`.trim();

        if (fullName && formData.childName !== fullName) {
          setFormData(prev => ({
            ...prev,
            childName: fullName,
            dysgraphicErrors: String(greenCount || 0),
            writingSamples: annotatedImage ? [annotatedImage] : prev.writingSamples
          }));

          const errorTypes: string[] = [];
          if (greenCount > 0) errorTypes.push('дисграфия');
          if (redCount > 0) errorTypes.push('дизорфография');

          if (errorTypes.length > 0) {
            setFormData(prev => ({
              ...prev,
              analysisErrors: greenCount > 0 ? ['пропуски', 'вставки'] : prev.analysisErrors
            }));
          }

          toast({
            title: 'Данные загружены',
            description: `Автоматически заполнены данные для ${fullName}`
          });

          localStorage.removeItem('dictation_to_form');
        }
      } catch (error) {
        console.error('Error loading dictation data:', error);
        localStorage.removeItem('dictation_to_form');
      }
    }
  }, []);

  return {
    formData,
    handleInputChange
  };
};