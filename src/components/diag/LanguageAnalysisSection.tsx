import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface LanguageAnalysisProps {
  languageAnalysis: string[];
  onCheckboxChange: (field: string, value: string, checked: boolean) => void;
}

export default function LanguageAnalysisSection({ languageAnalysis, onCheckboxChange }: LanguageAnalysisProps) {
  return (
    <div className="space-y-6">
      <Label className="text-lg font-semibold">Языковой анализ</Label>
        
      <div className="ml-4">
        <Label className="text-base font-semibold">Фонематический анализ и синтез</Label>
        <div className="mt-2 space-y-2">
          {[
            "фонематический анализ и синтез - норма",
            "сформированность навыков фонематического анализа и синтеза не соответствует возрастной норме",
            "фонематический анализ и синтез не сформированы"
          ].map(option => (
            <div key={option} className="flex items-start space-x-2">
              <Checkbox
                id={`lang-phonematic-${option}`}
                checked={languageAnalysis.includes(option)}
                onCheckedChange={(checked) => onCheckboxChange("languageAnalysis", option, !!checked)}
                className="mt-0.5"
              />
              <Label htmlFor={`lang-phonematic-${option}`} className="text-sm leading-5">{option}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="ml-4">
        <Label className="text-base font-semibold">Слоговой анализ</Label>
        <div className="mt-2 space-y-2">
          {[
            "слоговой анализ – норма",
            "сформированность навыка слогового анализа не соответствует возрастной норме",
            "слоговой анализ не сформирован"
          ].map(option => (
            <div key={option} className="flex items-start space-x-2">
              <Checkbox
                id={`lang-syllable-${option}`}
                checked={languageAnalysis.includes(option)}
                onCheckedChange={(checked) => onCheckboxChange("languageAnalysis", option, !!checked)}
                className="mt-0.5"
              />
              <Label htmlFor={`lang-syllable-${option}`} className="text-sm leading-5">{option}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="ml-4">
        <Label className="text-base font-semibold">Языковой анализ на уровне предложения</Label>
        <div className="mt-2 space-y-2">
          {[
            "языковой анализ на уровне предложения – норма",
            "сформированность навыка языкового анализа на уровне предложения не соответствует возрастной норме",
            "языковой анализ на уровне предложения не сформирован"
          ].map(option => (
            <div key={option} className="flex items-start space-x-2">
              <Checkbox
                id={`lang-sentence-${option}`}
                checked={languageAnalysis.includes(option)}
                onCheckedChange={(checked) => onCheckboxChange("languageAnalysis", option, !!checked)}
                className="mt-0.5"
              />
              <Label htmlFor={`lang-sentence-${option}`} className="text-sm leading-5">{option}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
