export interface DiagFormData {
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
  // Анамнестические данные
  prenatalDevelopment: string;
  prenatalDevelopmentCustom: string;
  neurologicalDisorders: string;
  neurologicalDisordersCustom: string;
  hearingVisionDisorders: string;
  hearingVisionDisordersCustom: string;
  chronicDiseases: string;
  chronicDiseasesCustom: string;
  speechEnvironment: string;
  speechEnvironmentCustom: string;
  previousSpecialists: string[];
  speechTherapistConclusion: string;
  defectologistConclusion: string;
  neuropsychologistConclusion: string;
  dominantHand: string;
  additionalInfo: string;
  // Экспрессивная речь
  motorRealization: string[];
  motorRealizationMultiple: string;
  motorRealizationOther: string;
  wordFormation: string[];
  grammaticalStructure: string;
  connectedSpeech: string[];
  nominativeFunction: string[];
  // Импрессивная речь
  wordUnderstanding: string;
  complexConstructions: string;
  phonematicPerception: string;
  // Письменная речь
  languageAnalysis: string[];
  readingSkill: string[];
  readingSpeed: string;
  readingComprehension: string;
  writingSamples: string[];
  dysgraphicErrors: string;
  dysorthographicErrors: string;
  totalErrors: string;
  analysisErrors: string[];
  acousticErrors: string[];
  motorErrors: string[];
  visualMotorErrors: string[];
  visualSpatialErrors: string[];
  additionalCharacteristics: string[];
  regulationViolations: string[];
  // Заключение
  speechDisorders: string[];
  dyslexiaTypes: string[];
  dysgraphiaTypes: string[];
  brainSyndromes: string[];
  // Финальные поля
  recommendations: string[];
  workDirections: string[];
  diagnosisDate: string;
  logopedist: string;
}