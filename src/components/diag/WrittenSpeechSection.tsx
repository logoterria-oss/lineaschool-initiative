import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

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
}

interface WrittenSpeechProps {
  formData: WrittenSpeechData;
  onInputChange: (field: string, value: string | string[]) => void;
}

export default function WrittenSpeechSection({ formData, onInputChange }: WrittenSpeechProps) {
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
        
        {/* Языковой анализ */}
        <div>
          <Label className="text-base font-semibold">Языковой анализ</Label>
          <div className="mt-4 space-y-6">
            
            {/* Группа 1: Фонематический анализ и синтез */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Фонематический анализ и синтез</Label>
              <div className="mt-2 space-y-2">
                {[
                  "фонематический анализ и синтез - норма",
                  "сформированность навыков фонематического анализа и синтеза не соответствует возрастной норме",
                  "фонематический анализ и синтез не сформированы"
                ].map(option => (
                  <div key={option} className="flex items-start space-x-2">
                    <Checkbox
                      id={`lang-phonematic-${option}`}
                      checked={formData.languageAnalysis.includes(option)}
                      onCheckedChange={(checked) => handleCheckboxChange("languageAnalysis", option, !!checked)}
                      className="mt-0.5"
                    />
                    <Label htmlFor={`lang-phonematic-${option}`} className="text-sm leading-5">{option}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Группа 2: Слоговой анализ */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Слоговой анализ</Label>
              <div className="mt-2 space-y-2">
                {[
                  "слоговой анализ – норма",
                  "сформированность навыка слогового анализа не соответствует возрастной норме",
                  "слоговой анализ не сформирован"
                ].map(option => (
                  <div key={option} className="flex items-start space-x-2">
                    <Checkbox
                      id={`lang-syllable-${option}`}
                      checked={formData.languageAnalysis.includes(option)}
                      onCheckedChange={(checked) => handleCheckboxChange("languageAnalysis", option, !!checked)}
                      className="mt-0.5"
                    />
                    <Label htmlFor={`lang-syllable-${option}`} className="text-sm leading-5">{option}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Группа 3: Языковой анализ на уровне предложения */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Языковой анализ на уровне предложения</Label>
              <div className="mt-2 space-y-2">
                {[
                  "языковой анализ на уровне предложения – норма",
                  "сформированность навыка языкового анализа на уровне предложения не соответствует возрастной норме",
                  "языковой анализ на уровне предложения не сформирован"
                ].map(option => (
                  <div key={option} className="flex items-start space-x-2">
                    <Checkbox
                      id={`lang-sentence-${option}`}
                      checked={formData.languageAnalysis.includes(option)}
                      onCheckedChange={(checked) => handleCheckboxChange("languageAnalysis", option, !!checked)}
                      className="mt-0.5"
                    />
                    <Label htmlFor={`lang-sentence-${option}`} className="text-sm leading-5">{option}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Навык чтения */}
        <div>
          <Label className="text-base font-semibold">Навык чтения</Label>
          <div className="mt-2 space-y-2">
            {[
              "побуквенное чтение",
              "побуквенно-послоговое чтение", 
              "послоговое чтение",
              "переход от послогового чтения к синтетическому",
              "синтетическое чтение",
              "- соответствует возрастной норме",
              "- НЕ соответствует возрастной норме",
              "пропуск, перестановка, замены букв/слогов/слов при чтении",
              "аграмматизмы при чтении",
              "ошибки угадывающего чтения",
              "затруднения в припоминании букв",
              "зеркальность чтения букв и/или слов"
            ].map(option => (
              <div key={option} className="flex items-start space-x-2">
                <Checkbox
                  id={`reading-skill-${option}`}
                  checked={formData.readingSkill.includes(option)}
                  onCheckedChange={(checked) => handleCheckboxChange("readingSkill", option, !!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor={`reading-skill-${option}`} className="text-sm leading-5">{option}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Скорость чтения */}
        <div>
          <Label htmlFor="reading-speed" className="text-base font-semibold">Скорость чтения</Label>
          <div className="mt-2 flex items-center space-x-2">
            <Input
              id="reading-speed"
              type="number"
              placeholder="___"
              value={formData.readingSpeed}
              onChange={(e) => onInputChange("readingSpeed", e.target.value)}
              className="w-24"
            />
            <span className="text-sm text-gray-600">слов/мин</span>
          </div>
        </div>

        {/* Понимание прочитанного */}
        <div>
          <Label htmlFor="reading-comprehension" className="text-base font-semibold">Понимание прочитанного</Label>
          <div className="mt-2 flex items-center space-x-2">
            <Input
              id="reading-comprehension"
              type="number"
              placeholder="___"
              value={formData.readingComprehension}
              onChange={(e) => onInputChange("readingComprehension", e.target.value)}
              className="w-24"
              min="0"
              max="100"
            />
            <span className="text-sm text-gray-600">%</span>
          </div>
        </div>

        {/* Пример письменных работ */}
        <div>
          <Label className="text-base font-semibold">Пример письменных работ (до 3 изображений)</Label>
          <div className="mt-2">
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileUpload("writingSamples", e.target.files)}
              className="mb-2"
            />
            {formData.writingSamples.length > 0 && (
              <div>
                <div className="text-sm text-gray-600 mb-2">
                  Прикреплено изображений: {formData.writingSamples.length}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {formData.writingSamples.map((sample, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={sample}
                        alt={`Письменная работа ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newSamples = formData.writingSamples.filter((_, i) => i !== index);
                          onInputChange("writingSamples", newSamples);
                        }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Количество дисграфических ошибок */}
        <div>
          <Label htmlFor="dysgraphic-errors" className="text-base font-semibold">Количество дисграфических ошибок</Label>
          <Input
            id="dysgraphic-errors"
            type="number"
            value={formData.dysgraphicErrors}
            onChange={(e) => onInputChange("dysgraphicErrors", e.target.value)}
            className="mt-2 w-24"
            min="0"
          />
        </div>

        {/* Ошибки языкового анализа и синтеза */}
        <div>
          <Label className="text-base font-semibold">Ошибки языкового анализа и синтеза</Label>
          <div className="mt-2 space-y-2">
            {[
              "нет",
              "пропуски", 
              "вставки",
              "перестановки",
              "антиципации (предвосхищение)"
            ].map(option => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`analysis-errors-${option}`}
                  checked={formData.analysisErrors.includes(option)}
                  onCheckedChange={(checked) => handleCheckboxChange("analysisErrors", option, !!checked)}
                />
                <Label htmlFor={`analysis-errors-${option}`} className="text-sm">{option}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Ошибки акустико-артикуляторного сходства */}
        <div>
          <Label className="text-base font-semibold">Ошибки акустико-артикуляторного сходства</Label>
          <div className="mt-2 space-y-2">
            {[
              "нет",
              "замены и смешения звонких-глухих согласных",
              "ошибки обозначения мягкости",
              "замены и смешения свистящих-шипящих согласных",
              "замены и смешения аффрикатов и их компонентов",
              "замены и смешения заднеязычных согласных",
              "замены и смешения соноров",
              "замены и смешения гласных в сильной позиции",
              "замены и смешения согласных по способу образования",
              "замены и смешения согласных по месту образования"
            ].map(option => (
              <div key={option} className="flex items-start space-x-2">
                <Checkbox
                  id={`acoustic-errors-${option}`}
                  checked={formData.acousticErrors.includes(option)}
                  onCheckedChange={(checked) => handleCheckboxChange("acousticErrors", option, !!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor={`acoustic-errors-${option}`} className="text-sm leading-5">{option}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Моторные ошибки */}
        <div>
          <Label className="text-base font-semibold">Моторные ошибки</Label>
          <div className="mt-2 space-y-2">
            {[
              "нет",
              "ошибки кинетического запуска",
              "графический поиск при написании буквы",
              "лишние элементы при написании буквы",
              "недописывание отдельных элементов буквы",
              "персеверации (повтор целой буквы, узнаваемой ее части или слога)",
              "неоднократные правильные обводки букв"
            ].map(option => (
              <div key={option} className="flex items-start space-x-2">
                <Checkbox
                  id={`motor-errors-${option}`}
                  checked={formData.motorErrors.includes(option)}
                  onCheckedChange={(checked) => handleCheckboxChange("motorErrors", option, !!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor={`motor-errors-${option}`} className="text-sm leading-5">{option}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Зрительно-моторные ошибки */}
        <div>
          <Label className="text-base font-semibold">Зрительно-моторные ошибки</Label>
          <div className="mt-2 space-y-2">
            {[
              "нет",
              "смешение оптически сходных букв",
              "неточность передачи графического образа буквы",
              "неадекватность начертания буквы"
            ].map(option => (
              <div key={option} className="flex items-start space-x-2">
                <Checkbox
                  id={`visual-motor-errors-${option}`}
                  checked={formData.visualMotorErrors.includes(option)}
                  onCheckedChange={(checked) => handleCheckboxChange("visualMotorErrors", option, !!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor={`visual-motor-errors-${option}`} className="text-sm leading-5">{option}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Зрительно-пространственные ошибки */}
        <div>
          <Label className="text-base font-semibold">Зрительно-пространственные ошибки</Label>
          <div className="mt-2 space-y-2">
            {[
              "нет",
              "зеркальность написания букв",
              "неудержание строки",
              "дисметрия букв",
              "дисметрия элементов букв",
              "колебание наклона букв",
              "отсутствие слитности написания букв в словах",
              "левостороннее игнорирование",
              "неравномерность расстояний между словами",
              "избегания переноса слов"
            ].map(option => (
              <div key={option} className="flex items-start space-x-2">
                <Checkbox
                  id={`visual-spatial-errors-${option}`}
                  checked={formData.visualSpatialErrors.includes(option)}
                  onCheckedChange={(checked) => handleCheckboxChange("visualSpatialErrors", option, !!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor={`visual-spatial-errors-${option}`} className="text-sm leading-5">{option}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Дополнительные характеристики письма */}
        <div>
          <Label className="text-base font-semibold">Дополнительные характеристики письма</Label>
          <div className="mt-2 space-y-2">
            {[
              "нет",
              "гипертонус и гипотонус при письме",
              "микрография или макрография"
            ].map(option => (
              <div key={option} className="flex items-start space-x-2">
                <Checkbox
                  id={`additional-characteristics-${option}`}
                  checked={formData.additionalCharacteristics.includes(option)}
                  onCheckedChange={(checked) => handleCheckboxChange("additionalCharacteristics", option, !!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor={`additional-characteristics-${option}`} className="text-sm leading-5">{option}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Нарушения регуляции письменной деятельности */}
        <div>
          <Label className="text-base font-semibold">Нарушения регуляции письменной деятельности</Label>
          <div className="mt-2 space-y-2">
            {[
              "нет",
              "пропуски элементов букв, букв, слогов, слов",
              "персеверации (навязчивые повторения) элементов букв, букв, слогов, слов",
              "контоминации (объединение слов)",
              "антиципации (предвосхищение слов и их элементов)",
              "ошибки обозначения границ предложения",
              "орфографические ошибки"
            ].map(option => (
              <div key={option} className="flex items-start space-x-2">
                <Checkbox
                  id={`regulation-violations-${option}`}
                  checked={formData.regulationViolations.includes(option)}
                  onCheckedChange={(checked) => handleCheckboxChange("regulationViolations", option, !!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor={`regulation-violations-${option}`} className="text-sm leading-5">{option}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}