import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface FinalData {
  recommendations: string[];
  workDirections: string[];
  diagnosisDate: string;
  logopedist: string;
}

interface FinalProps {
  formData: FinalData;
  onInputChange: (field: string, value: string | string[]) => void;
}

export default function FinalSection({ formData, onInputChange }: FinalProps) {
  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    const currentValues = formData[field as keyof FinalData] as string[];
    if (checked) {
      onInputChange(field, [...currentValues, value]);
    } else {
      onInputChange(field, currentValues.filter(item => item !== value));
    }
  };

  // Автоматически устанавливаем текущую дату при первой загрузке
  if (!formData.diagnosisDate) {
    const currentDate = new Date().toISOString().split('T')[0];
    onInputChange("diagnosisDate", currentDate);
  }

  return (
    <section className="bg-gray-50 p-6 rounded-lg">
      <div className="space-y-6">
        
        {/* Рекомендации */}
        <div>
          <Label className="text-base font-semibold">Рекомендации</Label>
          <div className="mt-2 space-y-2">
            {[
              "консультация невролога",
              "консультация психиатра",
              "нейрологопедические занятия не менее 2-3 раз в неделю",
              "нейрологопедические занятия не менее 3-4 раз в неделю",
              "чтение, прослушивание аудиокниг, просмотр экранизаций художественных произведений с последующим обсуждением",
              "письмо под диктовку, списывание деформированных текстов"
            ].map(option => (
              <div key={option} className="flex items-start space-x-2">
                <Checkbox
                  id={`recommendations-${option}`}
                  checked={formData.recommendations.includes(option)}
                  onCheckedChange={(checked) => handleCheckboxChange("recommendations", option, !!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor={`recommendations-${option}`} className="text-sm leading-5">{option}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Направления работы */}
        <div>
          <Label className="text-base font-semibold">Направления работы</Label>
          <div className="mt-2 space-y-2">
            {[
              "коррекция нарушений устной речи",
              "развитие фонематических процессов",
              "коррекция дизорфографии",
              "развитие графомоторных навыков",
              "развитие зрительного гнозиса, зрительной памяти, пространственных представлений, зрительного анализа и синтеза",
              "развитие функций регуляции и контроля"
            ].map(option => (
              <div key={option} className="flex items-start space-x-2">
                <Checkbox
                  id={`work-directions-${option}`}
                  checked={formData.workDirections.includes(option)}
                  onCheckedChange={(checked) => handleCheckboxChange("workDirections", option, !!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor={`work-directions-${option}`} className="text-sm leading-5">{option}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Дата диагностики */}
        <div>
          <Label htmlFor="diagnosis-date" className="text-base font-semibold">Дата диагностики</Label>
          <Input
            id="diagnosis-date"
            type="date"
            value={formData.diagnosisDate}
            onChange={(e) => onInputChange("diagnosisDate", e.target.value)}
            className="mt-2 w-48"
          />
        </div>

        {/* Логопед-диагност */}
        <div>
          <Label className="text-base font-semibold">Логопед-диагност</Label>
          <Select value={formData.logopedist} onValueChange={(value) => onInputChange("logopedist", value)}>
            <SelectTrigger className="mt-2 w-64">
              <SelectValue placeholder="Выберите логопеда" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Абраменко Виктория">Абраменко Виктория</SelectItem>
              <SelectItem value="Найденова Анастасия">Найденова Анастасия</SelectItem>
              <SelectItem value="Еремина Дарья">Еремина Дарья</SelectItem>
              <SelectItem value="Яновець Мила">Яновець Мила</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}