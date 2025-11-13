import LanguageAnalysisSection from "./LanguageAnalysisSection";
import ReadingSkillSection from "./ReadingSkillSection";
import WritingSkillSection from "./WritingSkillSection";

interface WrittenSpeechData {
  languageAnalysis: string[];
  readingSkill: string[];
  readingSpeed: string;
  readingComprehension: string;
  writingSamples: string[];
  dysgraphicErrors: string;
  analysisErrors: string[];
  acousticErrors: string[];
  motorErrors: string[];
  visualMotorErrors: string[];
  visualSpatialErrors: string[];
  additionalCharacteristics: string[];
  regulationViolations: string[];
  childName: string;
}

interface WrittenSpeechProps {
  formData: WrittenSpeechData;
  onInputChange: (field: string, value: string | string[]) => void;
  onLoadDictation?: () => void;
}

export default function WrittenSpeechSection({ formData, onInputChange, onLoadDictation }: WrittenSpeechProps) {
  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    const currentValues = formData[field as keyof WrittenSpeechData] as string[];
    if (checked) {
      onInputChange(field, [...currentValues, value]);
    } else {
      onInputChange(field, currentValues.filter(item => item !== value));
    }
  };

  const handleFileUpload = (field: string, files: FileList | null) => {
    if (files && files.length > 0) {
      const currentFiles = formData[field as keyof WrittenSpeechData] as string[];
      const newFilePromises = Array.from(files).slice(0, 3 - currentFiles.length).map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      });
      
      Promise.all(newFilePromises).then(base64Files => {
        const newFiles = [...currentFiles, ...base64Files].slice(0, 3);
        onInputChange(field, newFiles);
      });
    }
  };

  return (
    <section className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Письменная речь</h2>
      <div className="space-y-6">
        
        <LanguageAnalysisSection 
          languageAnalysis={formData.languageAnalysis}
          onCheckboxChange={handleCheckboxChange}
        />

        <ReadingSkillSection 
          readingSkill={formData.readingSkill}
          readingSpeed={formData.readingSpeed}
          readingComprehension={formData.readingComprehension}
          onCheckboxChange={handleCheckboxChange}
          onInputChange={onInputChange}
        />

        <WritingSkillSection 
          writingSamples={formData.writingSamples}
          dysgraphicErrors={formData.dysgraphicErrors}
          analysisErrors={formData.analysisErrors}
          acousticErrors={formData.acousticErrors}
          motorErrors={formData.motorErrors}
          visualMotorErrors={formData.visualMotorErrors}
          visualSpatialErrors={formData.visualSpatialErrors}
          additionalCharacteristics={formData.additionalCharacteristics}
          regulationViolations={formData.regulationViolations}
          childName={formData.childName}
          onCheckboxChange={handleCheckboxChange}
          onInputChange={onInputChange}
          onFileUpload={handleFileUpload}
          onLoadDictation={onLoadDictation}
        />

      </div>
    </section>
  );
}