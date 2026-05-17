import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";

interface ConclusionData {
  speechDisorders: string[];
  soundProductionType?: string;
  languageAnalysisTypes?: string[];
  dyslexiaTypes: string[];
  dysgraphiaTypes: string[];
  brainSyndromes: string[];
  normaDevelopment?: boolean;
}

interface ConclusionProps {
  formData: ConclusionData;
  onInputChange: (field: string, value: string[] | string | boolean) => void;
}

export default function ConclusionSection({ formData, onInputChange }: ConclusionProps) {
  const [showSoundProductionType, setShowSoundProductionType] = useState(
    formData.speechDisorders.includes("нарушения звукопроизношения")
  );
  const [showLanguageAnalysisType, setShowLanguageAnalysisType] = useState(
    formData.speechDisorders.includes("нарушения языкового анализа и синтеза")
  );

  const hasAnyDisorder =
    formData.speechDisorders.length > 0 ||
    formData.dyslexiaTypes.length > 0 ||
    formData.dysgraphiaTypes.length > 0 ||
    formData.brainSyndromes.length > 0;

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    const currentValues = (formData[field as keyof ConclusionData] as string[]) || [];
    if (checked) {
      onInputChange(field, [...currentValues, value]);
      if (field === "speechDisorders" && value === "нарушения звукопроизношения") {
        setShowSoundProductionType(true);
      }
      if (field === "speechDisorders" && value === "нарушения языкового анализа и синтеза") {
        setShowLanguageAnalysisType(true);
      }
    } else {
      onInputChange(field, currentValues.filter(item => item !== value));
      if (field === "speechDisorders" && value === "нарушения звукопроизношения") {
        setShowSoundProductionType(false);
        onInputChange("soundProductionType", "");
      }
      if (field === "speechDisorders" && value === "нарушения языкового анализа и синтеза") {
        setShowLanguageAnalysisType(false);
        onInputChange("languageAnalysisTypes", []);
      }
    }
  };

  return (
    <section className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Заключение</h2>
      <div className="space-y-6">
        
        {/* Группа 1: Нарушения речи */}
        <div>
          <Label className="text-base font-semibold">Нарушения речи</Label>
          <div className="mt-2 space-y-2">
            {/* Нарушения звукопроизношения с уточнением */}
            <div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="speech-disorders-нарушения звукопроизношения"
                  checked={formData.speechDisorders.includes("нарушения звукопроизношения")}
                  onCheckedChange={(checked) => handleCheckboxChange("speechDisorders", "нарушения звукопроизношения", !!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor="speech-disorders-нарушения звукопроизношения" className="text-sm leading-5">нарушения звукопроизношения</Label>
              </div>
              {showSoundProductionType && (
                <div className="ml-6 mt-2 p-3 bg-white rounded border border-gray-200">
                  <Label className="text-sm font-medium mb-2 block">Уточнение типа нарушения:</Label>
                  <RadioGroup 
                    value={formData.soundProductionType || ""} 
                    onValueChange={(value: string) => onInputChange("soundProductionType", value)}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="дислалия" id="sound-type-dyslalia" />
                      <Label htmlFor="sound-type-dyslalia" className="text-sm cursor-pointer">дислалия</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="дизартрия" id="sound-type-dysarthria" />
                      <Label htmlFor="sound-type-dysarthria" className="text-sm cursor-pointer">дизартрия</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>

            {/* Нарушение фонематического восприятия */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="speech-disorders-нарушение фонематического восприятия"
                checked={formData.speechDisorders.includes("нарушение фонематического восприятия")}
                onCheckedChange={(checked) => handleCheckboxChange("speechDisorders", "нарушение фонематического восприятия", !!checked)}
                className="mt-0.5"
              />
              <Label htmlFor="speech-disorders-нарушение фонематического восприятия" className="text-sm leading-5">нарушение фонематического восприятия</Label>
            </div>

            {/* Нарушения языкового анализа и синтеза с уточнением */}
            <div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="speech-disorders-нарушения языкового анализа и синтеза"
                  checked={formData.speechDisorders.includes("нарушения языкового анализа и синтеза")}
                  onCheckedChange={(checked) => handleCheckboxChange("speechDisorders", "нарушения языкового анализа и синтеза", !!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor="speech-disorders-нарушения языкового анализа и синтеза" className="text-sm leading-5">нарушения языкового анализа и синтеза</Label>
              </div>
              {showLanguageAnalysisType && (
                <div className="ml-6 mt-2 p-3 bg-white rounded border border-gray-200">
                  <Label className="text-sm font-medium mb-2 block">Уточнение уровня:</Label>
                  <div className="space-y-2">
                    {[
                      "на уровне звуков",
                      "на уровне слогов",
                      "на уровне слов в предложении и предложений в тексте"
                    ].map(level => (
                      <div key={level} className="flex items-center space-x-2">
                        <Checkbox
                          id={`lang-analysis-${level}`}
                          checked={(formData.languageAnalysisTypes || []).includes(level)}
                          onCheckedChange={(checked) => handleCheckboxChange("languageAnalysisTypes", level, !!checked)}
                        />
                        <Label htmlFor={`lang-analysis-${level}`} className="text-sm cursor-pointer">{level}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Лексико-грамматическое недоразвитие речи */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="speech-disorders-лексико-грамматическое недоразвитие речи"
                checked={formData.speechDisorders.includes("лексико-грамматическое недоразвитие речи")}
                onCheckedChange={(checked) => handleCheckboxChange("speechDisorders", "лексико-грамматическое недоразвитие речи", !!checked)}
                className="mt-0.5"
              />
              <Label htmlFor="speech-disorders-лексико-грамматическое недоразвитие речи" className="text-sm leading-5">лексико-грамматическое недоразвитие речи</Label>
            </div>
          </div>
        </div>

        {/* Группа 2: Виды дислексии */}
        <div>
          <Label className="text-base font-semibold">Виды дислексии</Label>
          <div className="mt-2 space-y-2">
            {[
              "фонематическая дислексия",
              "аграмматическая дислексия",
              "семантическая дислексия",
              "мнестическая дислексия",
              "оптическая дислексия",
              "регуляторная дислексия"
            ].map(option => (
              <div key={option} className="flex items-start space-x-2">
                <Checkbox
                  id={`dyslexia-types-${option}`}
                  checked={formData.dyslexiaTypes.includes(option)}
                  onCheckedChange={(checked) => handleCheckboxChange("dyslexiaTypes", option, !!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor={`dyslexia-types-${option}`} className="text-sm leading-5">{option}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Группа 3: Виды дисграфии */}
        <div>
          <Label className="text-base font-semibold">Виды дисграфии</Label>
          <div className="mt-2 space-y-2">
            {[
              "артикуляторно-акустическая дисграфия",
              "акустическая дисграфия",
              "дисграфия на почве нарушений языкового анализа и синтеза (регуляторная дисграфия)",
              "регуляторная дисграфия",
              "регуляторная дисграфия с моторными проявлениями",
              "оптико-моторная дисграфия",
              "дизорфография"
            ].map(option => (
              <div key={option} className="flex items-start space-x-2">
                <Checkbox
                  id={`dysgraphia-types-${option}`}
                  checked={formData.dysgraphiaTypes.includes(option)}
                  onCheckedChange={(checked) => handleCheckboxChange("dysgraphiaTypes", option, !!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor={`dysgraphia-types-${option}`} className="text-sm leading-5">{option}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Группа 4: Синдромы слабости функций мозга */}
        <div>
          <Label className="text-base font-semibold">Синдромы слабости функций мозга</Label>
          <div className="mt-2 space-y-2">
            {[
              "синдром слабости функций III (регуляторного) блока мозга",
              "синдром слабости левополушарных функций II блока мозга – отдела переработки слуховой и кинестетической информации",
              "синдром слабости правополушарных функций мозга (отставанием в развитии холистической стратегии переработки зрительно-пространственной, зрительной и слуховой информации)"
            ].map(option => (
              <div key={option} className="flex items-start space-x-2">
                <Checkbox
                  id={`brain-syndromes-${option}`}
                  checked={formData.brainSyndromes.includes(option)}
                  onCheckedChange={(checked) => handleCheckboxChange("brainSyndromes", option, !!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor={`brain-syndromes-${option}`} className="text-sm leading-5">{option}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Норма развития */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="norma-development"
              checked={!!formData.normaDevelopment}
              disabled={hasAnyDisorder}
              onCheckedChange={(checked) => onInputChange("normaDevelopment", !!checked)}
              className="mt-0.5"
            />
            <div>
              <Label
                htmlFor="norma-development"
                className={`text-sm font-semibold leading-5 ${hasAnyDisorder ? "text-gray-400 cursor-not-allowed" : "cursor-pointer"}`}
              >
                Норма развития
              </Label>
              {hasAnyDisorder && (
                <p className="text-xs text-gray-400 mt-0.5">Недоступно при выбранных нарушениях</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}