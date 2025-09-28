import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface ExpressiveSpeechData {
  motorRealization: string[];
  wordFormation: string[];
  grammaticalStructure: string;
  connectedSpeech: string[];
  nominativeFunction: string[];
  motorRealizationOther?: string;
  motorRealizationMultiple?: string;
}

interface ExpressiveSpeechProps {
  formData: ExpressiveSpeechData;
  onInputChange: (field: string, value: string | string[]) => void;
}

export default function ExpressiveSpeechSection({ formData, onInputChange }: ExpressiveSpeechProps) {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [showMultipleInput, setShowMultipleInput] = useState(false);

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    const currentValues = formData[field as keyof ExpressiveSpeechData] as string[];
    if (checked) {
      onInputChange(field, [...currentValues, value]);
    } else {
      onInputChange(field, currentValues.filter(item => item !== value));
    }
  };

  const handleSoundGroupRadio = (value: string) => {
    onInputChange("motorRealization", [value]);
    setShowOtherInput(value === "другое");
    setShowMultipleInput(value === "нарушены 2 и более группы звуков");
  };

  return (
    <section className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Экспрессивная речь</h2>
      <div className="space-y-6">
        
        {/* Моторная реализация высказывания */}
        <div>
          <Label className="text-base font-semibold">Моторная реализация высказывания</Label>
          <div className="mt-4">
            <Label className="text-sm font-medium text-gray-700">Звукопроизношение:</Label>
            <RadioGroup 
              value={formData.motorRealization[0] || ""} 
              onValueChange={handleSoundGroupRadio}
              className="mt-2 space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="норма" id="sound-norm" />
                <Label htmlFor="sound-norm" className="text-sm">норма</Label>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="нарушена одна группа звуков" id="sound-one" />
                  <Label htmlFor="sound-one" className="text-sm">нарушена одна группа звуков</Label>
                </div>
                {formData.motorRealization[0] === "нарушена одна группа звуков" && (
                  <div className="ml-6 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {["свистящие", "шипящие", "аффрикаты", "Л-Ль", "Р-Рь"].map(option => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={`one-group-${option}`}
                            checked={formData.motorRealization.includes(option)}
                            onCheckedChange={(checked) => handleCheckboxChange("motorRealization", option, !!checked)}
                          />
                          <Label htmlFor={`one-group-${option}`} className="text-sm">{option}</Label>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="one-group-other"
                        checked={showOtherInput}
                        onCheckedChange={(checked) => setShowOtherInput(!!checked)}
                      />
                      <Label htmlFor="one-group-other" className="text-sm">другое</Label>
                    </div>
                    {showOtherInput && (
                      <Input
                        placeholder="Укажите другую группу звуков"
                        value={formData.motorRealizationOther || ""}
                        onChange={(e) => onInputChange("motorRealizationOther", e.target.value)}
                        className="ml-6 max-w-xs"
                      />
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="нарушены 2 и более группы звуков" id="sound-multiple" />
                  <Label htmlFor="sound-multiple" className="text-sm">нарушены 2 и более группы звуков</Label>
                </div>
                {formData.motorRealization[0] === "нарушены 2 и более группы звуков" && (
                  <Input
                    placeholder="Укажите какие группы звуков нарушены"
                    value={formData.motorRealizationMultiple || ""}
                    onChange={(e) => onInputChange("motorRealizationMultiple", e.target.value)}
                    className="ml-6 max-w-md"
                  />
                )}
              </div>
            </RadioGroup>
          </div>

        </div>

          {/* Слоговая структура слова */}
          <div className="mt-6">
            <Label className="text-sm font-medium text-gray-700">Слоговая структура слова</Label>
            <div className="mt-2 space-y-2">
              {[
                "слоговая структура слова не нарушена",
                "слоговая структура слова нарушена"
              ].map(option => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`syllable-${option}`}
                    checked={formData.motorRealization.includes(option)}
                    onCheckedChange={(checked) => handleCheckboxChange("motorRealization", option, !!checked)}
                  />
                  <Label htmlFor={`syllable-${option}`} className="text-sm">{option}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Кинетический артикуляционный праксис */}
          <div className="mt-6">
            <Label className="text-sm font-medium text-gray-700">Кинетический артикуляционный праксис</Label>
            <div className="mt-2 space-y-2">
              {[
                "кинетический артикуляционный праксис в норме",
                "кинетический артикуляционный праксис нарушен"
              ].map(option => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`kinetic-${option}`}
                    checked={formData.motorRealization.includes(option)}
                    onCheckedChange={(checked) => handleCheckboxChange("motorRealization", option, !!checked)}
                  />
                  <Label htmlFor={`kinetic-${option}`} className="text-sm">{option}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Словообразовательные процессы */}
        <div>
          <Label className="text-base font-semibold">Словообразовательные процессы</Label>
          <div className="mt-2 space-y-2">
            {[
              "норма",
              "нарушено образование уменьшительных форм существительных",
              "нарушено образование прилагательных"
            ].map(option => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`word-formation-${option}`}
                  checked={formData.wordFormation.includes(option)}
                  onCheckedChange={(checked) => handleCheckboxChange("wordFormation", option, !!checked)}
                />
                <Label htmlFor={`word-formation-${option}`} className="text-sm">{option}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Сформированность грамматического строя речи */}
        <div>
          <Label className="text-base font-semibold">Сформированность грамматического строя речи</Label>
          <RadioGroup 
            value={formData.grammaticalStructure} 
            onValueChange={(value) => onInputChange("grammaticalStructure", value)}
            className="mt-2"
          >
            {[
              "норма",
              "негрубые аграмматизмы", 
              "грубые аграмматизмы"
            ].map(option => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`grammar-${option}`} />
                <Label htmlFor={`grammar-${option}`} className="text-sm">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Связная речь */}
        <div>
          <Label className="text-base font-semibold">Связная речь</Label>
          <div className="mt-2 space-y-2">
            {[
              "норма",
              "тенденция к фрагментарности текста",
              "смысловая неточность",
              "бедность активного словаря",
              "пропуск отдельных смысловых звеньев и/или связующих элементов",
              "неоднократные необоснованные повторы слов и предложений",
              "малая длина текста, которая свидетельствует о трудностях смыслового программирования и грамматического структурирования",
              "малая длина синтагм, которая указывает на синтагматические трудности, т.е. функциональную недостаточность передних отделов коры"
            ].map(option => (
              <div key={option} className="flex items-start space-x-2">
                <Checkbox
                  id={`connected-speech-${option}`}
                  checked={formData.connectedSpeech.includes(option)}
                  onCheckedChange={(checked) => handleCheckboxChange("connectedSpeech", option, !!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor={`connected-speech-${option}`} className="text-sm leading-5">{option}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Номинативная функция речи */}
        <div>
          <Label className="text-base font-semibold">Номинативная функция речи</Label>
          <div className="mt-2 space-y-2">
            {[
              "норма",
              "вербальные парафазии",
              "латеральные парафазии"
            ].map(option => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`nominative-${option}`}
                  checked={formData.nominativeFunction.includes(option)}
                  onCheckedChange={(checked) => handleCheckboxChange("nominativeFunction", option, !!checked)}
                />
                <Label htmlFor={`nominative-${option}`} className="text-sm">{option}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}