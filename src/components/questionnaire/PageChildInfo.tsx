import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormData, HandleInputChange } from "./types";

interface Props {
  formData: FormData;
  handleInputChange: HandleInputChange;
}

export default function PageChildInfo({ formData, handleInputChange }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Данные ребёнка
      </h2>

      <div>
        <Label htmlFor="child-name">ФИО ребёнка *</Label>
        <Input
          id="child-name"
          value={formData.childName}
          onChange={(e) => handleInputChange("childName", e.target.value)}
          className="mt-2"
          required
        />
      </div>

      <div>
        <Label htmlFor="birth-date">Дата рождения *</Label>
        <Input
          id="birth-date"
          type="date"
          value={formData.birthDate}
          onChange={(e) => handleInputChange("birthDate", e.target.value)}
          className="mt-2"
          required
        />
      </div>

      <div>
        <Label htmlFor="grade">Класс *</Label>
        <Select
          value={formData.grade}
          onValueChange={(val) => handleInputChange("grade", val)}
          required
        >
          <SelectTrigger id="grade" className="mt-2">
            <SelectValue placeholder="Выберите класс" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 11 }, (_, i) => String(i + 1)).map((g) => (
              <SelectItem key={g} value={g}>{g} класс</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Форма получения образования *</Label>
        <div className="mt-2 space-y-2">
          {[
            { value: "school", label: "Общеобразовательная школа / лицей / гимназия" },
            { value: "correctional", label: "Коррекционная школа" },
            { value: "family", label: "Семейное образование" }
          ].map(option => (
            <div key={option.value} className="flex items-start space-x-2">
              <Checkbox
                id={`education-${option.value}`}
                checked={formData.educationType === option.value}
                onCheckedChange={(checked) => {
                  if (checked) handleInputChange("educationType", option.value);
                }}
              />
              <Label htmlFor={`education-${option.value}`} className="text-sm leading-5">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Реализуется ли АООП (адаптированная образовательная программа)? *</Label>
        <RadioGroup
          value={formData.aoopRequired}
          onValueChange={(value) => handleInputChange("aoopRequired", value)}
          className="mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="aoop-yes" />
            <Label htmlFor="aoop-yes">Да</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="aoop-no" />
            <Label htmlFor="aoop-no">Нет</Label>
          </div>
        </RadioGroup>
      </div>

      {formData.aoopRequired === "yes" && (
        <div>
          <Label htmlFor="aoop-variant">Вариант АООП</Label>
          <Input
            id="aoop-variant"
            value={formData.aoopVariant}
            onChange={(e) => handleInputChange("aoopVariant", e.target.value)}
            className="mt-2"
            placeholder="Например: АООП НОО ОВЗ вариант 5.1"
          />
        </div>
      )}

      <div>
        <Label htmlFor="school-start-age">Возраст начала школьного обучения *</Label>
        <Select
          value={formData.schoolStartAge}
          onValueChange={(val) => handleInputChange("schoolStartAge", val)}
        >
          <SelectTrigger id="school-start-age" className="mt-2">
            <SelectValue placeholder="Выберите возраст" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 5 }, (_, i) => String(i + 5)).map((age) => (
              <SelectItem key={age} value={age}>{age} лет</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Посещал ли ребёнок детский сад? *</Label>
        <RadioGroup
          value={formData.kindergarten}
          onValueChange={(value) => handleInputChange("kindergarten", value)}
          className="mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="kindergarten-yes" />
            <Label htmlFor="kindergarten-yes">Да</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="kindergarten-no" />
            <Label htmlFor="kindergarten-no">Нет</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
