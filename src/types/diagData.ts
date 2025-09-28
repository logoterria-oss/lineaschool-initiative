export interface DiagData {
  // Персональные данные
  childName: string;
  birthDate: string;
  age: string;
  grade: string;
  parentName: string;
  phone: string;
  email: string;
  complaints: string;
  educationForm: string;
  aoop: string;
  schoolStartAge: string;
  kindergarten: string;

  // Анамнестические данные
  prenatalDevelopment: string;
  neurologicalDiseases: string;
  hearingVisionDisorders: string;
  chronicDiseases: string;
  speechEnvironment: string;
  previousTherapy: string[];
  logopedConclusion: string;
  defectologistConclusion: string;
  neuropsychologistConclusion: string;
  dominantHand: string;
  additionalInfo: string;

  // Экспрессивная речь
  motorRealization: string[];
  wordFormation: string[];
  grammaticalStructure: string;
  connectedSpeech: string[];
  nominativeFunction: string[];

  // Импрессивная речь
  understandingWords: string;
  complexConstructions: string;
  phonematicPerception: string;

  // Письменная речь
  languageAnalysis: string[];
  readingSkill: string[];
  readingSpeed: string;
  readingComprehension: string;
  writtenSamples: File[];
  dysgraphicErrors: string;
  analysisErrors: string[];
  acousticErrors: string[];
  motorErrors: string[];
  visualMotorErrors: string[];
  spatialErrors: string[];
  additionalWritingFeatures: string[];
  regulationViolations: string[];

  // Заключение
  conclusion: string[];

  // Рекомендации
  recommendations: string[];

  // Направления работы
  workDirections: string[];

  // Дата и логопед
  diagnosisDate: string;
  logopedist: string;
}