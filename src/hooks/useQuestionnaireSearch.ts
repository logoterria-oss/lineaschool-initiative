import { useState, useCallback } from 'react';

interface QuestionnaireData {
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  birthDate: string;
  grade: string;
  educationType: string;
  aoopRequired: string;
  aoopVariant: string;
  schoolStartAge: string;
  kindergarten: string;
  prenatalDevelopment: string;
  neurologicalDisorders: string;
  hearingVisionDisorders: string;
  chronicDiseases: string;
  speechEnvironment: string;
  previousSpecialists: string[];
  speechTherapistConclusion: string;
  neuropsychologistConclusion: string;
  defectologistConclusion: string;
  dominantHand: string;
}

export function useQuestionnaireSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchByChildName = useCallback(async (childName: string): Promise<QuestionnaireData | null> => {
    if (!childName || childName.length < 3) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://functions.poehali.dev/65751635-528e-4830-bc09-e0b9c5344580?childName=${encodeURIComponent(childName)}`
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error('Ошибка при поиске данных');
      }

      const data = await response.json();
      
      // Map education type values from questionnaire to diag form
      const educationTypeMap: Record<string, string> = {
        'school': 'school',
        'correctional': 'special',
        'family': 'homeschool'
      };
      
      // Map database fields to form fields
      return {
        parentName: data.parent_name || '',
        parentPhone: data.parent_phone || '',
        parentEmail: data.parent_email || '',
        birthDate: data.birth_date || '',
        grade: data.grade || '',
        educationType: educationTypeMap[data.education_type] || data.education_type || '',
        aoopRequired: data.aoop_required || '',
        aoopVariant: data.aoop_variant || '',
        schoolStartAge: data.school_start_age || '',
        kindergarten: data.kindergarten || '',
        prenatalDevelopment: data.prenatal_development || '',
        neurologicalDisorders: data.neurological_disorders || '',
        hearingVisionDisorders: data.hearing_vision_disorders || '',
        chronicDiseases: data.chronic_diseases || '',
        speechEnvironment: data.speech_environment || '',
        previousSpecialists: data.previous_specialists || [],
        speechTherapistConclusion: data.speech_therapist_conclusion || '',
        neuropsychologistConclusion: data.neuropsychologist_conclusion || '',
        defectologistConclusion: data.defectologist_conclusion || '',
        dominantHand: data.dominant_hand || ''
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка поиска');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { searchByChildName, isLoading, error };
}