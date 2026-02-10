import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Icon from '@/components/ui/icon';

interface WritingSkillProps {
  writingSamples: string[];
  dysgraphicErrors: string;
  dysorthographicErrors: string;
  totalErrors: string;
  analysisErrors: string[];
  acousticErrors: string[];
  motorErrors: string[];
  visualMotorErrors: string[];
  visualSpatialErrors: string[];
  additionalCharacteristics: string[];
  regulationViolations: string[];
  regulationViolationsOther?: string;
  childName: string;
  onCheckboxChange: (field: string, value: string, checked: boolean) => void;
  onInputChange: (field: string, value: string | string[]) => void;
  onFileUpload: (field: string, files: FileList | null) => void;
  onLoadDictation?: () => void;
}

export default function WritingSkillSection({
  writingSamples,
  dysgraphicErrors,
  dysorthographicErrors,
  totalErrors,
  analysisErrors,
  acousticErrors,
  motorErrors,
  visualMotorErrors,
  visualSpatialErrors,
  additionalCharacteristics,
  regulationViolations,
  regulationViolationsOther,
  childName,
  onCheckboxChange,
  onInputChange,
  onFileUpload,
  onLoadDictation
}: WritingSkillProps) {
  return (
    <div className="space-y-6">
      <Label className="text-lg font-semibold">Навык письма</Label>

      <div className="ml-4">
        <Label className="text-base font-semibold">Пример письменных работ (до 3 изображений)</Label>
        <div className="mt-2 space-y-2">
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => onFileUpload("writingSamples", e.target.files)}
          />
          {onLoadDictation && childName && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onLoadDictation}
              className="w-full"
            >
              <Icon name="FileCheck" className="mr-2" size={16} />
              Вставить проверенный диктант
            </Button>
          )}
          {writingSamples.length > 0 && (
            <div>
              <div className="text-sm text-gray-600 mb-2">
                Прикреплено изображений: {writingSamples.length}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {writingSamples.map((sample, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={sample}
                      alt={`Письменная работа ${index + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newSamples = writingSamples.filter((_, i) => i !== index);
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

      <div className="ml-4 space-y-4">
        <div>
          <Label htmlFor="dysgraphic-errors" className="text-base font-semibold">Количество дисграфических ошибок</Label>
          <Input
            id="dysgraphic-errors"
            type="number"
            value={dysgraphicErrors}
            onChange={(e) => onInputChange("dysgraphicErrors", e.target.value)}
            className="mt-2 w-32"
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="dysorthographic-errors" className="text-base font-semibold">Количество дизорфографических ошибок</Label>
          <Input
            id="dysorthographic-errors"
            type="number"
            value={dysorthographicErrors}
            onChange={(e) => onInputChange("dysorthographicErrors", e.target.value)}
            className="mt-2 w-32"
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="total-errors" className="text-base font-semibold">Ошибок всего</Label>
          <Input
            id="total-errors"
            type="number"
            value={totalErrors}
            onChange={(e) => onInputChange("totalErrors", e.target.value)}
            className="mt-2 w-32"
            min="0"
          />
        </div>
      </div>

      <div className="ml-4">
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
                checked={analysisErrors.includes(option)}
                onCheckedChange={(checked) => onCheckboxChange("analysisErrors", option, !!checked)}
              />
              <Label htmlFor={`analysis-errors-${option}`} className="text-sm">{option}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="ml-4">
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
                checked={acousticErrors.includes(option)}
                onCheckedChange={(checked) => onCheckboxChange("acousticErrors", option, !!checked)}
                className="mt-0.5"
              />
              <Label htmlFor={`acoustic-errors-${option}`} className="text-sm leading-5">{option}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="ml-4">
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
                checked={motorErrors.includes(option)}
                onCheckedChange={(checked) => onCheckboxChange("motorErrors", option, !!checked)}
                className="mt-0.5"
              />
              <Label htmlFor={`motor-errors-${option}`} className="text-sm leading-5">{option}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="ml-4">
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
                checked={visualMotorErrors.includes(option)}
                onCheckedChange={(checked) => onCheckboxChange("visualMotorErrors", option, !!checked)}
                className="mt-0.5"
              />
              <Label htmlFor={`visual-motor-errors-${option}`} className="text-sm leading-5">{option}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="ml-4">
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
                checked={visualSpatialErrors.includes(option)}
                onCheckedChange={(checked) => onCheckboxChange("visualSpatialErrors", option, !!checked)}
                className="mt-0.5"
              />
              <Label htmlFor={`visual-spatial-errors-${option}`} className="text-sm leading-5">{option}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="ml-4">
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
                checked={additionalCharacteristics.includes(option)}
                onCheckedChange={(checked) => onCheckboxChange("additionalCharacteristics", option, !!checked)}
                className="mt-0.5"
              />
              <Label htmlFor={`additional-characteristics-${option}`} className="text-sm leading-5">{option}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="ml-4">
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
                checked={regulationViolations.includes(option)}
                onCheckedChange={(checked) => onCheckboxChange("regulationViolations", option, !!checked)}
                className="mt-0.5"
              />
              <Label htmlFor={`regulation-violations-${option}`} className="text-sm leading-5">{option}</Label>
            </div>
          ))}
          <div className="mt-3">
            <Label htmlFor="regulation-violations-other" className="text-sm font-medium">Другие ошибки регуляции (укажите через запятую)</Label>
            <Input
              id="regulation-violations-other"
              placeholder="Укажите другие нарушения регуляции"
              value={regulationViolationsOther || ""}
              onChange={(e) => onInputChange("regulationViolationsOther", e.target.value)}
              className="mt-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}