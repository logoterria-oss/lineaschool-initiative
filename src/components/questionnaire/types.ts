export interface FormData {
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  childName: string;
  birthDate: string;
  grade: string;
  educationType: string;
  aoopRequired: string;
  aoopVariant: string;
  schoolStartAge: string;
  kindergarten: string;
  prenatalDevelopment: string;
  earlyDevelopment: string;
  neurologicalDisorders: string;
  hearingVisionDisorders: string;
  chronicDiseases: string;
  speechEnvironment: string;
  previousSpecialists: string[];
  speechTherapistConclusion: string;
  speechTherapistCurrent: boolean;
  neuropsychologistConclusion: string;
  neuropsychologistCurrent: boolean;
  defectologistConclusion: string;
  defectologistCurrent: boolean;
  otherSpecialistName: string;
  dominantHand: string;
}

export type HandleInputChange = (field: string, value: string | string[] | boolean) => void;
export type HandleCheckboxChange = (field: string, value: string, checked: boolean) => void;