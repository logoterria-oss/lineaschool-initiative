import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface ConclusionData {
  speechDisorders: string[];
  dyslexiaTypes: string[];
  dysgraphiaTypes: string[];
  brainSyndromes: string[];
}

interface ConclusionProps {
  formData: ConclusionData;
  onInputChange: (field: string, value: string[]) => void;
}

export default function ConclusionSection({ formData, onInputChange }: ConclusionProps) {
  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    const currentValues = formData[field as keyof ConclusionData];
    if (checked) {
      onInputChange(field, [...currentValues, value]);
    } else {
      onInputChange(field, currentValues.filter(item => item !== value));
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
            {[
              "Нарушения звукопроизношения",
              "Нарушение фонематических процессов",
              "Лексико-грамматическое недоразвитие речи"
            ].map(option => (
              <div key={option} className="flex items-start space-x-2">
                <Checkbox
                  id={`speech-disorders-${option}`}
                  checked={formData.speechDisorders.includes(option)}
                  onCheckedChange={(checked) => handleCheckboxChange("speechDisorders", option, !!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor={`speech-disorders-${option}`} className="text-sm leading-5">{option}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Группа 2: Виды дислексии */}
        <div>
          <Label className="text-base font-semibold">Виды дислексии</Label>
          <div className="mt-2 space-y-2">
            {[
              "Фонематическая дислексия",
              "Аграмматическая дислексия",
              "Семантическая дислексия",
              "Мнестическая дислексия",
              "Оптическая дислексия"
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
              "Артикуляторно-акустическая дисграфия",
              "Акустическая дисграфия",
              "Дисграфия на почве нарушений языкового анализа и синтеза",
              "Оптико-моторная дисграфия",
              "Дизорфография"
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
              "Синдром слабости функций III (регуляторного) блока мозга",
              "Синдром слабости левополушарных функций II блока мозга – отдела переработки слуховой и кинестетической информации",
              "Синдром слабости правополушарных функций мозга (отставанием в развитии холистической стратегии переработки зрительно-пространственной, зрительной и слуховой информации)"
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
      </div>
    </section>
  );
}