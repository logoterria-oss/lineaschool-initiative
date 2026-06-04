import { Suspense, lazy } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import SectionLoader from "@/components/SectionLoader";
import type { DiagFormData } from "@/types/diagFormData";
import PersonalDataSection from "@/components/diag/PersonalDataSection";

// Ленивая загрузка секций для улучшения производительности
const AnamnesticsSection = lazy(() => import("@/components/diag/AnamnesticsSection"));
const ExpressiveSpeechSection = lazy(() => import("@/components/diag/ExpressiveSpeechSection"));
const ImpressiveSpeechSection = lazy(() => import("@/components/diag/ImpressiveSpeechSection"));
const WrittenSpeechSection = lazy(() => import("@/components/diag/WrittenSpeechSection"));
const ConclusionSection = lazy(() => import("@/components/diag/ConclusionSection"));
const FinalSection = lazy(() => import("@/components/diag/FinalSection"));

interface FormSectionsProps {
  formData: DiagFormData;
  onInputChange: (field: string, value: string | string[]) => void;
}

const FormSections = ({ formData, onInputChange }: FormSectionsProps) => {
  return (
    <>
      <ErrorBoundary>
        <PersonalDataSection 
          formData={{
            childName: formData.childName,
            birthDate: formData.birthDate,
            age: formData.age,
            grade: formData.grade,
            parentName: formData.parentName,
            phone: formData.phone,
            email: formData.email,
            city: formData.city,
            cityRegion: formData.cityRegion,
            complaints: formData.complaints,
            educationType: formData.educationType,
            aoop: formData.aoop,
            schoolStartAge: formData.schoolStartAge,
            kindergarten: formData.kindergarten
          }}
          onInputChange={onInputChange}
        />
      </ErrorBoundary>

      <ErrorBoundary>
        <Suspense fallback={<SectionLoader />}>
          <AnamnesticsSection 
            formData={{
              prenatalDevelopment: formData.prenatalDevelopment,
              prenatalDevelopmentCustom: formData.prenatalDevelopmentCustom,
              earlyDevelopment: formData.earlyDevelopment,
              earlyDevelopmentCustom: formData.earlyDevelopmentCustom,
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
            onInputChange={onInputChange}
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
            onInputChange={onInputChange}
          />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary>
        <Suspense fallback={<SectionLoader />}>
          <ExpressiveSpeechSection 
            formData={{
              motorRealization: formData.motorRealization,
              motorRealizationMultiple: formData.motorRealizationMultiple,
              motorRealizationOther: formData.motorRealizationOther,
              wordFormation: formData.wordFormation,
              grammaticalStructure: formData.grammaticalStructure,
              connectedSpeech: formData.connectedSpeech,
              nominativeFunction: formData.nominativeFunction
            }}
            onInputChange={onInputChange}
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
              dysorthographicErrors: formData.dysorthographicErrors,
              totalErrors: formData.totalErrors,
              analysisErrors: formData.analysisErrors,
              acousticErrors: formData.acousticErrors,
              motorErrors: formData.motorErrors,
              visualMotorErrors: formData.visualMotorErrors,
              visualSpatialErrors: formData.visualSpatialErrors,
              additionalCharacteristics: formData.additionalCharacteristics,
              regulationViolations: formData.regulationViolations,
              regulationViolationsOther: formData.regulationViolationsOther,
              childName: formData.childName
            }}
            onInputChange={onInputChange}
          />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary>
        <Suspense fallback={<SectionLoader />}>
          <ConclusionSection 
            formData={{
              speechDisorders: formData.speechDisorders,
              soundProductionType: formData.soundProductionType,
              languageAnalysisTypes: formData.languageAnalysisTypes,
              dyslexiaTypes: formData.dyslexiaTypes,
              dysgraphiaTypes: formData.dysgraphiaTypes,
              brainSyndromes: formData.brainSyndromes,
              normaDevelopment: formData.normaDevelopment
            }}
            onInputChange={onInputChange}
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
            onInputChange={onInputChange}
          />
        </Suspense>
      </ErrorBoundary>
    </>
  );
};

export default FormSections;