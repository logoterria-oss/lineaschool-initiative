import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ExpressiveSpeechData {
  motorRealization: string[];
  wordFormation: string[];
  grammaticalStructure: string;
  connectedSpeech: string[];
  nominativeFunction: string[];
}

interface ExpressiveSpeechProps {
  formData: ExpressiveSpeechData;
  onInputChange: (field: string, value: string | string[]) => void;
}

export default function ExpressiveSpeechSection({ formData, onInputChange }: ExpressiveSpeechProps) {
  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    const currentValues = formData[field as keyof ExpressiveSpeechData] as string[];
    if (checked) {
      onInputChange(field, [...currentValues, value]);
    } else {
      onInputChange(field, currentValues.filter(item => item !== value));
    }
  };

  return (
    <section className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Экспрессивная речь</h2>
      <div className="space-y-6">
        
        {/* Моторная реализация высказывания */}
        <div>
          <Label className="text-base font-semibold">Моторная реализация высказывания</Label>
          <div className="mt-4 space-y-6">
            
            {/* Группа 1: Звуки раннего и среднего онтогенеза */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Звуки раннего и среднего онтогенеза</Label>
              <div className="mt-2 space-y-2">
                {[
                  "нормативное произношение звуков раннего и среднего онтогенеза",
                  "замены звуков раннего и среднего онтогенеза", 
                  "искаженное произношение звуков раннего и среднего онтогенеза"
                ].map(option => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`motor-early-${option}`}
                      checked={formData.motorRealization.includes(option)}
                      onCheckedChange={(checked) => handleCheckboxChange("motorRealization", option, !!checked)}
                    />
                    <Label htmlFor={`motor-early-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Группа 2: Свистящие и шипящие звуки */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Свистящие и шипящие звуки</Label>
              <div className="mt-2 space-y-2">
                {[
                  "нормативное произношение свистящих и шипящих звуков",
                  "замены свистящих и шипящих звуков",
                  "искаженное произношение свистящих и шипящих звуков"
                ].map(option => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`motor-whistle-${option}`}
                      checked={formData.motorRealization.includes(option)}
                      onCheckedChange={(checked) => handleCheckboxChange("motorRealization", option, !!checked)}
                    />
                    <Label htmlFor={`motor-whistle-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Группа 3: Сонорные звуки */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Сонорные звуки</Label>
              <div className="mt-2 space-y-2">
                {[
                  "нормативное произношение сонорных звуков",
                  "замены сонорных звуков",
                  "искаженное произношение сонорных звуков"
                ].map(option => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`motor-sonor-${option}`}
                      checked={formData.motorRealization.includes(option)}
                      onCheckedChange={(checked) => handleCheckboxChange("motorRealization", option, !!checked)}
                    />
                    <Label htmlFor={`motor-sonor-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Группа 4: Слоговая структура */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Слоговая структура слова</Label>
              <div className="mt-2 space-y-2">
                {[
                  "слоговая структура слова не нарушена",
                  "слоговая структура слова нарушена"
                ].map(option => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`motor-syllable-${option}`}
                      checked={formData.motorRealization.includes(option)}
                      onCheckedChange={(checked) => handleCheckboxChange("motorRealization", option, !!checked)}
                    />
                    <Label htmlFor={`motor-syllable-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Группа 5: Артикуляционные пробы */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Артикуляционные пробы</Label>
              <div className="mt-2 space-y-2">
                {[
                  "артикуляционные пробы выполняет",
                  "выполняет не все предложенные артикуляционные пробы"
                ].map(option => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`motor-artic-${option}`}
                      checked={formData.motorRealization.includes(option)}
                      onCheckedChange={(checked) => handleCheckboxChange("motorRealization", option, !!checked)}
                    />
                    <Label htmlFor={`motor-artic-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Группа 6: Кинетический праксис */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Кинетический артикуляционный праксис</Label>
              <div className="mt-2 space-y-2">
                {[
                  "кинетический артикуляционный праксис в норме",
                  "кинетический артикуляционный праксис нарушен"
                ].map(option => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`motor-kinetic-${option}`}
                      checked={formData.motorRealization.includes(option)}
                      onCheckedChange={(checked) => handleCheckboxChange("motorRealization", option, !!checked)}
                    />
                    <Label htmlFor={`motor-kinetic-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </div>
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