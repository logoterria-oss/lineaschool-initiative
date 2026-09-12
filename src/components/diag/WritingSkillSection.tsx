import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ErrorCountField from "@/components/diag/ErrorCountField";
import ErrorTypeGroup from "@/components/diag/ErrorTypeGroup";
import DictationPicker from "@/components/dictations/DictationPicker";
import { PRIMARY_SET } from "@/components/dictations/dictationCatalog";

interface WritingSkillProps {
  writingSamples: string[];
  dictationWords: string;
  grade?: string;
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
  orthographicErrorTypes: string[];
  orthographicErrorsOther?: string;
  childName: string;
  onCheckboxChange: (field: string, value: string, checked: boolean) => void;
  onInputChange: (field: string, value: string | string[]) => void;
  onFileUpload: (field: string, files: FileList | null) => void;
}

export default function WritingSkillSection({
  writingSamples,
  dictationWords,
  grade,
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
  orthographicErrorTypes,
  orthographicErrorsOther,
  childName,
  onCheckboxChange,
  onInputChange,
  onFileUpload,
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
          <Label htmlFor="dictation-words" className="text-base font-semibold">Количество слов в работе</Label>
          <p className="text-sm text-gray-500 mt-1">
            Нужно, чтобы сравнивать ошибки между работами разной длины
          </p>
          <DictationPicker
            sets={[PRIMARY_SET]}
            words={dictationWords}
            grade={grade}
            onWordsChange={(v) => onInputChange("dictationWords", v)}
            className="mt-2"
          />
        </div>

        <ErrorCountField
          id="dysgraphic-errors"
          label="Количество дисграфических ошибок"
          value={dysgraphicErrors}
          onChange={(v) => onInputChange("dysgraphicErrors", v)}
        />

        <ErrorCountField
          id="dysorthographic-errors"
          label="Количество орфографических ошибок"
          value={dysorthographicErrors}
          onChange={(v) => onInputChange("dysorthographicErrors", v)}
        />

        <ErrorCountField
          id="total-errors"
          label="Ошибок всего"
          value={totalErrors}
          onChange={(v) => onInputChange("totalErrors", v)}
        />
      </div>

      <ErrorTypeGroup
        idPrefix="analysis-errors"
        field="analysisErrors"
        label="Ошибки языкового анализа и синтеза"
        options={[
            "пропуски",
            "вставки",
            "перестановки",
            "антиципации (предвосхищение)",
          ]}
        selected={analysisErrors}
        onCheckboxChange={onCheckboxChange}
        onInputChange={onInputChange}
      ></ErrorTypeGroup>

      <ErrorTypeGroup
        idPrefix="acoustic-errors"
        field="acousticErrors"
        label="Ошибки акустико-артикуляторного сходства"
        options={[
            "замены и смешения звонких-глухих согласных",
            "ошибки обозначения мягкости",
            "замены и смешения свистящих-шипящих согласных",
            "замены и смешения аффрикатов и их компонентов",
            "замены и смешения заднеязычных согласных",
            "замены и смешения соноров",
            "замены и смешения гласных в сильной позиции",
            "замены и смешения согласных по способу образования",
            "замены и смешения согласных по месту образования",
          ]}
        selected={acousticErrors}
        onCheckboxChange={onCheckboxChange}
        onInputChange={onInputChange}
      ></ErrorTypeGroup>

      <ErrorTypeGroup
        idPrefix="motor-errors"
        field="motorErrors"
        label="Моторные ошибки"
        options={[
            "ошибки кинетического запуска",
            "графический поиск при написании буквы",
            "лишние элементы при написании буквы",
            "недописывание отдельных элементов буквы",
            "персеверации (повтор целой буквы, узнаваемой ее части или слога)",
            "неоднократные правильные обводки букв",
          ]}
        selected={motorErrors}
        onCheckboxChange={onCheckboxChange}
        onInputChange={onInputChange}
      ></ErrorTypeGroup>

      <ErrorTypeGroup
        idPrefix="visual-motor-errors"
        field="visualMotorErrors"
        label="Зрительно-моторные ошибки"
        options={[
            "смешение оптически сходных букв",
            "неточность передачи графического образа буквы",
            "неадекватность начертания буквы",
          ]}
        selected={visualMotorErrors}
        onCheckboxChange={onCheckboxChange}
        onInputChange={onInputChange}
      ></ErrorTypeGroup>

      <ErrorTypeGroup
        idPrefix="visual-spatial-errors"
        field="visualSpatialErrors"
        label="Зрительно-пространственные ошибки"
        options={[
            "зеркальность написания букв",
            "неудержание строки",
            "дисметрия букв",
            "дисметрия элементов букв",
            "колебание наклона букв",
            "отсутствие слитности написания букв в словах",
            "левостороннее игнорирование",
            "неравномерность расстояний между словами",
            "избегания переноса слов",
          ]}
        selected={visualSpatialErrors}
        onCheckboxChange={onCheckboxChange}
        onInputChange={onInputChange}
      ></ErrorTypeGroup>

      <ErrorTypeGroup
        idPrefix="additional-characteristics"
        field="additionalCharacteristics"
        label="Дополнительные характеристики письма"
        options={[
            "гипертонус и гипотонус при письме",
            "микрография или макрография",
          ]}
        selected={additionalCharacteristics}
        onCheckboxChange={onCheckboxChange}
        onInputChange={onInputChange}
      ></ErrorTypeGroup>

      <ErrorTypeGroup
        idPrefix="regulation-violations"
        field="regulationViolations"
        label="Нарушения регуляции письменной деятельности"
        options={[
            "пропуски элементов букв, букв, слогов, слов",
            "персеверации (навязчивые повторения) элементов букв, букв, слогов, слов",
            "контоминации (объединение слов)",
            "антиципации (предвосхищение слов и их элементов)",
            "ошибки обозначения границ предложения",
            "орфографические ошибки",
          ]}
        selected={regulationViolations}
        onCheckboxChange={onCheckboxChange}
        onInputChange={onInputChange}
      >
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
      </ErrorTypeGroup>

      <ErrorTypeGroup
        idPrefix="orthographic-error-types"
        field="orthographicErrorTypes"
        label="Орфографические ошибки"
        options={[
          "Заглавная буква в начале предложения",
          "Правописание безударных гласных",
          "Слова с удвоенными согласными",
          "Правописание слов с мягким знаком",
          "Правописание парных глухих и звонких согласных",
          "Буквосочетания жи-ши, ча-ща, чу-щу",
          "Заглавная буква в именах собственных",
          "Буквосочетания чк, чн, чт, щн, нч",
          "Разделительный мягкий знак",
          "Не с глаголами",
          "Правописание предлогов со словами",
          "Правописание слов с непроизносимым согласным",
          "Правописание приставок",
          "Правописание суффиксов",
          "Разделительный твёрдый знак",
          "Соединительные гласные о и е в сложных словах",
          "Мягкий знак после шипящих на конце имён существительных",
          "Правописание слов с буквами ь и ъ",
          "Безударные падежные окончания имён существительных",
          "Безударные падежные окончания имён прилагательных",
          "Мягкий знак после шипящих на конце глаголов 2-го лица ед.ч.",
          "Мягкий знак в глаголах на -ться, -тся",
          "Безударные личные окончания глаголов",
          "Правописание местоимений",
          "Непроверяемые гласные и согласные",
        ]}
        selected={orthographicErrorTypes}
        onCheckboxChange={onCheckboxChange}
        onInputChange={onInputChange}
      >
        <div className="mt-3">
          <Label htmlFor="orthographic-errors-other" className="text-sm font-medium">Другие орфографические ошибки (укажите через запятую)</Label>
          <Input
            id="orthographic-errors-other"
            placeholder="Укажите другие орфографические ошибки"
            value={orthographicErrorsOther || ""}
            onChange={(e) => onInputChange("orthographicErrorsOther", e.target.value)}
            className="mt-2"
          />
        </div>
      </ErrorTypeGroup>
    </div>
  );
}