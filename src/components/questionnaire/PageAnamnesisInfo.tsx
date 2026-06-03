import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormData, HandleInputChange, HandleCheckboxChange } from "./types";

interface Props {
  formData: FormData;
  handleInputChange: HandleInputChange;
  handleCheckboxChange: HandleCheckboxChange;
  prenatalNoFeatures: boolean;
  setPrenatalNoFeatures: (v: boolean) => void;
  earlyDevNoFeatures: boolean;
  setEarlyDevNoFeatures: (v: boolean) => void;
  neurologicalNone: boolean;
  setNeurologicalNone: (v: boolean) => void;
  hearingVisionNone: boolean;
  setHearingVisionNone: (v: boolean) => void;
  chronicNone: boolean;
  setChronicNone: (v: boolean) => void;
  speechEnvNone: boolean;
  setSpeechEnvNone: (v: boolean) => void;
}

export default function PageAnamnesisInfo({
  formData,
  handleInputChange,
  handleCheckboxChange,
  prenatalNoFeatures,
  setPrenatalNoFeatures,
  earlyDevNoFeatures,
  setEarlyDevNoFeatures,
  neurologicalNone,
  setNeurologicalNone,
  hearingVisionNone,
  setHearingVisionNone,
  chronicNone,
  setChronicNone,
  speechEnvNone,
  setSpeechEnvNone,
}: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Анамнестические данные
      </h2>

      <div>
        <Label htmlFor="prenatal">Особенности перинатального развития *</Label>
        <Textarea
          id="prenatal"
          value={formData.prenatalDevelopment}
          onChange={(e) => handleInputChange("prenatalDevelopment", e.target.value)}
          className="mt-2"
          placeholder="Болезни мамы во время беременности, патологии плода, угроза выкидыша, недоношенность, затяжные/стремительные роды, родовые травмы и т.п."
          rows={4}
        />
        <div className="flex items-center gap-2 mt-2">
          <Checkbox
            id="prenatal-no-features"
            checked={prenatalNoFeatures}
            onCheckedChange={(checked) => setPrenatalNoFeatures(!!checked)}
          />
          <Label htmlFor="prenatal-no-features" className="font-normal cursor-pointer">Без особенностей</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="early-development">Особенности развития в первые 3 года жизни</Label>
        <Textarea
          id="early-development"
          value={formData.earlyDevelopment}
          onChange={(e) => handleInputChange("earlyDevelopment", e.target.value)}
          className="mt-2"
          placeholder="Особенности моторного, речевого, психического развития в первые 3 года жизни"
          rows={4}
        />
        <div className="flex items-center gap-2 mt-2">
          <Checkbox
            id="early-dev-no-features"
            checked={earlyDevNoFeatures}
            onCheckedChange={(checked) => setEarlyDevNoFeatures(!!checked)}
          />
          <Label htmlFor="early-dev-no-features" className="font-normal cursor-pointer">Без особенностей</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="neurological">
          Диагностированные неврологические заболевания и/или психические расстройства *
        </Label>
        <Input
          id="neurological"
          value={formData.neurologicalDisorders}
          onChange={(e) => handleInputChange("neurologicalDisorders", e.target.value)}
          className="mt-2"
        />
        <div className="flex items-center gap-2 mt-2">
          <Checkbox
            id="neurological-none"
            checked={neurologicalNone}
            onCheckedChange={(checked) => setNeurologicalNone(!!checked)}
          />
          <Label htmlFor="neurological-none" className="font-normal cursor-pointer">Нет / не диагностировано</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="hearing-vision">Нарушения слуха и/или зрения *</Label>
        <Input
          id="hearing-vision"
          value={formData.hearingVisionDisorders}
          onChange={(e) => handleInputChange("hearingVisionDisorders", e.target.value)}
          className="mt-2"
        />
        <div className="flex items-center gap-2 mt-2">
          <Checkbox
            id="hearing-vision-none"
            checked={hearingVisionNone}
            onCheckedChange={(checked) => setHearingVisionNone(!!checked)}
          />
          <Label htmlFor="hearing-vision-none" className="font-normal cursor-pointer">Нет / не диагностировано</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="chronic">Другие хронические заболевания *</Label>
        <Input
          id="chronic"
          value={formData.chronicDiseases}
          onChange={(e) => handleInputChange("chronicDiseases", e.target.value)}
          className="mt-2"
        />
        <div className="flex items-center gap-2 mt-2">
          <Checkbox
            id="chronic-none"
            checked={chronicNone}
            onCheckedChange={(checked) => setChronicNone(!!checked)}
          />
          <Label htmlFor="chronic-none" className="font-normal cursor-pointer">Нет / не диагностировано</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="speech-env">Случаи речевых нарушений в семье? *</Label>
        <Input
          id="speech-env"
          value={formData.speechEnvironment}
          onChange={(e) => handleInputChange("speechEnvironment", e.target.value)}
          className="mt-2"
        />
        <div className="flex items-center gap-2 mt-2">
          <Checkbox
            id="speech-env-none"
            checked={speechEnvNone}
            onCheckedChange={(checked) => setSpeechEnvNone(!!checked)}
          />
          <Label htmlFor="speech-env-none" className="font-normal cursor-pointer">Нет / не диагностировано</Label>
        </div>
      </div>

      <div>
        <Label>Занимался ли ребёнок ранее с коррекционными педагогами и/или психологами? *</Label>
        <div className="mt-2 space-y-2">
          {["Нет", "Логопед", "Дефектолог", "Нейропсихолог", "Другое"].map(specialist => (
            <div key={specialist} className="flex items-center space-x-2">
              <Checkbox
                id={`specialist-${specialist}`}
                checked={formData.previousSpecialists.includes(specialist)}
                onCheckedChange={(checked) => handleCheckboxChange("previousSpecialists", specialist, !!checked)}
              />
              <Label htmlFor={`specialist-${specialist}`}>{specialist}</Label>
            </div>
          ))}
        </div>
      </div>

      {formData.previousSpecialists.includes("Логопед") && (
        <div className="pl-4 border-l-2 border-green-200 space-y-3">
          <Label className="font-medium">Логопед</Label>
          <div>
            <Label htmlFor="speech-therapist">Заключение (при наличии)</Label>
            <Input
              id="speech-therapist"
              value={formData.speechTherapistConclusion}
              onChange={(e) => handleInputChange("speechTherapistConclusion", e.target.value)}
              className="mt-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="speech-therapist-current"
              checked={formData.speechTherapistCurrent}
              onCheckedChange={(checked) => handleInputChange("speechTherapistCurrent", !!checked)}
            />
            <Label htmlFor="speech-therapist-current" className="font-normal cursor-pointer">Занимаемся сейчас</Label>
          </div>
        </div>
      )}

      {formData.previousSpecialists.includes("Дефектолог") && (
        <div className="pl-4 border-l-2 border-green-200 space-y-3">
          <Label className="font-medium">Дефектолог</Label>
          <div>
            <Label htmlFor="defectologist">Заключение (при наличии)</Label>
            <Input
              id="defectologist"
              value={formData.defectologistConclusion}
              onChange={(e) => handleInputChange("defectologistConclusion", e.target.value)}
              className="mt-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="defectologist-current"
              checked={formData.defectologistCurrent}
              onCheckedChange={(checked) => handleInputChange("defectologistCurrent", !!checked)}
            />
            <Label htmlFor="defectologist-current" className="font-normal cursor-pointer">Занимаемся сейчас</Label>
          </div>
        </div>
      )}

      {formData.previousSpecialists.includes("Нейропсихолог") && (
        <div className="pl-4 border-l-2 border-green-200 space-y-3">
          <Label className="font-medium">Нейропсихолог</Label>
          <div>
            <Label htmlFor="neuropsychologist">Заключение (при наличии)</Label>
            <Input
              id="neuropsychologist"
              value={formData.neuropsychologistConclusion}
              onChange={(e) => handleInputChange("neuropsychologistConclusion", e.target.value)}
              className="mt-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="neuropsychologist-current"
              checked={formData.neuropsychologistCurrent}
              onCheckedChange={(checked) => handleInputChange("neuropsychologistCurrent", !!checked)}
            />
            <Label htmlFor="neuropsychologist-current" className="font-normal cursor-pointer">Занимаемся сейчас</Label>
          </div>
        </div>
      )}

      {formData.previousSpecialists.includes("Другое") && (
        <div className="pl-4 border-l-2 border-green-200 space-y-3">
          <Label className="font-medium">Другое</Label>
          <div>
            <Label htmlFor="other-specialist">Укажите специалиста</Label>
            <Input
              id="other-specialist"
              value={formData.otherSpecialistName}
              onChange={(e) => handleInputChange("otherSpecialistName", e.target.value)}
              className="mt-2"
              placeholder="Например, детский психолог, ABA-терапевт, сурдопедагог..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="other-specialist-current"
              checked={formData.otherSpecialistCurrent}
              onCheckedChange={(checked) => handleInputChange("otherSpecialistCurrent", !!checked)}
            />
            <Label htmlFor="other-specialist-current" className="font-normal cursor-pointer">Занимаемся сейчас</Label>
          </div>
        </div>
      )}

      <div>
        <Label>Ведущая рука</Label>
        <RadioGroup
          value={formData.dominantHand}
          onValueChange={(value) => handleInputChange("dominantHand", value)}
          className="mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="right" id="hand-right" />
            <Label htmlFor="hand-right">Правша</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="left" id="hand-left" />
            <Label htmlFor="hand-left">Левша</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="retrained" id="hand-retrained" />
            <Label htmlFor="hand-retrained">Правша (переученный левша)</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}