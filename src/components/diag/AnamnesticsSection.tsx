import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface AnamnesticsData {
  prenatalDevelopment: string;
  prenatalDevelopmentCustom: string;
  neurologicalDisorders: string;
  neurologicalDisordersCustom: string;
  hearingVisionDisorders: string;
  hearingVisionDisordersCustom: string;
  chronicDiseases: string;
  chronicDiseasesCustom: string;
  speechEnvironment: string;
  speechEnvironmentCustom: string;
  previousSpecialists: string[];
  speechTherapistConclusion: string;
  defectologistConclusion: string;
  neuropsychologistConclusion: string;
  dominantHand: string;
  additionalInfo: string;
}

interface AnamnesticsProps {
  formData: AnamnesticsData;
  onInputChange: (field: string, value: string | string[]) => void;
}

export default function AnamnesticsSection({ formData, onInputChange }: AnamnesticsProps) {
  return (
    <section className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Анамнестические данные</h2>
      <div className="space-y-6">
        {/* Особенности пренатального развития */}
        <div>
          <Label>Особенности пренатального развития</Label>
          <div className="mt-2 space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="prenatal-normal"
                name="prenatalDevelopment"
                value="Без особенностей"
                checked={formData.prenatalDevelopment === "Без особенностей"}
                onChange={(e) => onInputChange("prenatalDevelopment", e.target.value)}
                className="rounded"
              />
              <Label htmlFor="prenatal-normal">Без особенностей</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="prenatal-custom"
                name="prenatalDevelopment"
                value="custom"
                checked={formData.prenatalDevelopment === "custom"}
                onChange={(e) => onInputChange("prenatalDevelopment", e.target.value)}
                className="rounded"
              />
              <Label htmlFor="prenatal-custom">Другое:</Label>
            </div>
            {formData.prenatalDevelopment === "custom" && (
              <Textarea
                value={formData.prenatalDevelopmentCustom}
                onChange={(e) => onInputChange("prenatalDevelopmentCustom", e.target.value)}
                placeholder="Опишите особенности..."
                className="mt-2"
              />
            )}
          </div>
        </div>

        {/* Неврологические заболевания */}
        <div>
          <Label>Неврологические заболевания и/или психические расстройства</Label>
          <div className="mt-2 space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="neuro-normal"
                name="neurologicalDisorders"
                value="Нет / не диагностировано"
                checked={formData.neurologicalDisorders === "Нет / не диагностировано"}
                onChange={(e) => onInputChange("neurologicalDisorders", e.target.value)}
                className="rounded"
              />
              <Label htmlFor="neuro-normal">Нет / не диагностировано</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="neuro-custom"
                name="neurologicalDisorders"
                value="custom"
                checked={formData.neurologicalDisorders === "custom"}
                onChange={(e) => onInputChange("neurologicalDisorders", e.target.value)}
                className="rounded"
              />
              <Label htmlFor="neuro-custom">Есть:</Label>
            </div>
            {formData.neurologicalDisorders === "custom" && (
              <Textarea
                value={formData.neurologicalDisordersCustom}
                onChange={(e) => onInputChange("neurologicalDisordersCustom", e.target.value)}
                placeholder="Укажите заболевания..."
                className="mt-2"
              />
            )}
          </div>
        </div>

        {/* Нарушения слуха и/или зрения */}
        <div>
          <Label>Нарушения слуха и/или зрения</Label>
          <div className="mt-2 space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="hearing-normal"
                name="hearingVisionDisorders"
                value="Нет / не диагностировано"
                checked={formData.hearingVisionDisorders === "Нет / не диагностировано"}
                onChange={(e) => onInputChange("hearingVisionDisorders", e.target.value)}
                className="rounded"
              />
              <Label htmlFor="hearing-normal">Нет / не диагностировано</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="hearing-custom"
                name="hearingVisionDisorders"
                value="custom"
                checked={formData.hearingVisionDisorders === "custom"}
                onChange={(e) => onInputChange("hearingVisionDisorders", e.target.value)}
                className="rounded"
              />
              <Label htmlFor="hearing-custom">Есть:</Label>
            </div>
            {formData.hearingVisionDisorders === "custom" && (
              <Textarea
                value={formData.hearingVisionDisordersCustom}
                onChange={(e) => onInputChange("hearingVisionDisordersCustom", e.target.value)}
                placeholder="Укажите нарушения..."
                className="mt-2"
              />
            )}
          </div>
        </div>

        {/* Другие хронические заболевания */}
        <div>
          <Label>Другие хронические заболевания</Label>
          <div className="mt-2 space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="chronic-normal"
                name="chronicDiseases"
                value="Нет / не диагностировано"
                checked={formData.chronicDiseases === "Нет / не диагностировано"}
                onChange={(e) => onInputChange("chronicDiseases", e.target.value)}
                className="rounded"
              />
              <Label htmlFor="chronic-normal">Нет / не диагностировано</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="chronic-custom"
                name="chronicDiseases"
                value="custom"
                checked={formData.chronicDiseases === "custom"}
                onChange={(e) => onInputChange("chronicDiseases", e.target.value)}
                className="rounded"
              />
              <Label htmlFor="chronic-custom">Есть:</Label>
            </div>
            {formData.chronicDiseases === "custom" && (
              <Textarea
                value={formData.chronicDiseasesCustom}
                onChange={(e) => onInputChange("chronicDiseasesCustom", e.target.value)}
                placeholder="Укажите заболевания..."
                className="mt-2"
              />
            )}
          </div>
        </div>

        {/* Речевое окружение */}
        <div>
          <Label>Речевое окружение, случаи речевых нарушений в семье</Label>
          <div className="mt-2 space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="speech-normal"
                name="speechEnvironment"
                value="Нет"
                checked={formData.speechEnvironment === "Нет"}
                onChange={(e) => onInputChange("speechEnvironment", e.target.value)}
                className="rounded"
              />
              <Label htmlFor="speech-normal">Нет</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="speech-custom"
                name="speechEnvironment"
                value="custom"
                checked={formData.speechEnvironment === "custom"}
                onChange={(e) => onInputChange("speechEnvironment", e.target.value)}
                className="rounded"
              />
              <Label htmlFor="speech-custom">Есть:</Label>
            </div>
            {formData.speechEnvironment === "custom" && (
              <Textarea
                value={formData.speechEnvironmentCustom}
                onChange={(e) => onInputChange("speechEnvironmentCustom", e.target.value)}
                placeholder="Опишите речевые особенности в семье..."
                className="mt-2"
              />
            )}
          </div>
        </div>

        {/* Предыдущие специалисты */}
        <div>
          <Label>Занимался ли с логопедом/дефектологом/нейропсихологом ранее</Label>
          <div className="mt-2 space-y-2">
            {["нет", "логопед", "дефектолог", "нейропсихолог"].map(specialist => (
              <div key={specialist} className="flex items-center space-x-2">
                <Checkbox
                  id={`specialist-${specialist}`}
                  checked={formData.previousSpecialists.includes(specialist)}
                  onCheckedChange={(checked) => {
                    const current = formData.previousSpecialists;
                    if (checked) {
                      onInputChange("previousSpecialists", [...current, specialist]);
                    } else {
                      onInputChange("previousSpecialists", current.filter(s => s !== specialist));
                    }
                  }}
                />
                <Label htmlFor={`specialist-${specialist}`} className="capitalize">{specialist}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Заключения специалистов */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="speechTherapistConclusion">Заключение логопеда</Label>
            <Textarea
              id="speechTherapistConclusion"
              value={formData.speechTherapistConclusion}
              onChange={(e) => onInputChange("speechTherapistConclusion", e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="defectologistConclusion">Заключение дефектолога</Label>
            <Textarea
              id="defectologistConclusion"
              value={formData.defectologistConclusion}
              onChange={(e) => onInputChange("defectologistConclusion", e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="neuropsychologistConclusion">Заключение нейропсихолога</Label>
            <Textarea
              id="neuropsychologistConclusion"
              value={formData.neuropsychologistConclusion}
              onChange={(e) => onInputChange("neuropsychologistConclusion", e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        {/* Ведущая рука */}
        <div>
          <Label htmlFor="dominantHand">Ведущая рука</Label>
          <Select onValueChange={(value) => onInputChange("dominantHand", value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Выберите вариант" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="right">Правша</SelectItem>
              <SelectItem value="left">Левша</SelectItem>
              <SelectItem value="retrained">Правша (переученный левша)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Дополнительные сведения */}
        <div>
          <Label htmlFor="additionalInfo">Дополнительные сведения</Label>
          <Textarea
            id="additionalInfo"
            value={formData.additionalInfo}
            onChange={(e) => onInputChange("additionalInfo", e.target.value)}
            className="mt-1"
            rows={4}
          />
        </div>
      </div>
    </section>
  );
}