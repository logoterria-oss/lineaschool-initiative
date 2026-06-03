import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import DiagFormNavigation from "@/components/diag/DiagFormNavigation";
import Footer from "@/components/Footer";

export default function ParentQuestionnaire() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    // Контактные данные
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    
    // Данные ребенка
    childName: "",
    birthDate: "",
    grade: "",
    
    // Образование
    educationType: "",
    aoopRequired: "",
    aoopVariant: "",
    schoolStartAge: "",
    kindergarten: "",
    
    // Анамнестические данные
    prenatalDevelopment: "",
    neurologicalDisorders: "",
    hearingVisionDisorders: "",
    chronicDiseases: "",
    speechEnvironment: "",
    previousSpecialists: [] as string[],
    speechTherapistConclusion: "",
    neuropsychologistConclusion: "",
    defectologistConclusion: "",
    dominantHand: ""
  });

  const [prenatalNoFeatures, setPrenatalNoFeatures] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    const currentValues = formData[field as keyof typeof formData] as string[];
    if (checked) {
      handleInputChange(field, [...currentValues, value]);
    } else {
      handleInputChange(field, currentValues.filter(item => item !== value));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('https://functions.poehali.dev/65751635-528e-4830-bc09-e0b9c5344580', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, prenatalNoFeatures })
      });

      if (response.ok) {
        alert('Анкета успешно отправлена! Спасибо!');
        navigate('/');
      } else {
        alert('Ошибка при отправке анкеты. Попробуйте еще раз.');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при отправке анкеты. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <DiagFormNavigation />

      <main className="flex-1 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Анкета для родителей
            </h1>
            <p className="text-gray-600">
              Заполните данные о ребёнке для диагностики
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-8">
            {/* Страница 1: Контактные данные */}
            {currentPage === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Контактные данные родителя
                </h2>

                <div>
                  <Label htmlFor="parent-name">ФИО родителя (законного представителя) *</Label>
                  <Input
                    id="parent-name"
                    value={formData.parentName}
                    onChange={(e) => handleInputChange("parentName", e.target.value)}
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="parent-phone">Номер телефона родителя (законного представителя) *</Label>
                  <Input
                    id="parent-phone"
                    type="tel"
                    value={formData.parentPhone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                      let masked = '';
                      if (digits.length === 0) {
                        masked = '';
                      } else {
                        const d = digits[0] === '8' ? '7' + digits.slice(1) : digits;
                        masked = '+7';
                        if (d.length > 1) masked += ' (' + d.slice(1, 4);
                        if (d.length >= 4) masked += ') ' + d.slice(4, 7);
                        if (d.length >= 7) masked += '-' + d.slice(7, 9);
                        if (d.length >= 9) masked += '-' + d.slice(9, 11);
                      }
                      handleInputChange("parentPhone", masked);
                    }}
                    className="mt-2"
                    placeholder="+7 (900) 123-45-67"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="parent-email">Электронная почта родителя (законного представителя) *</Label>
                  <Input
                    id="parent-email"
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) => handleInputChange("parentEmail", e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            )}

            {/* Страница 2: Данные ребенка */}
            {currentPage === 2 && (
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
            )}

            {/* Страница 3: Анамнестические данные */}
            {currentPage === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Анамнестические данные
                </h2>

                <div>
                  <Label htmlFor="prenatal">Особенности перинатального развития</Label>
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
                  <Label htmlFor="neurological">
                    Диагностированные неврологические заболевания и/или психические расстройства
                  </Label>
                  <Input
                    id="neurological"
                    value={formData.neurologicalDisorders}
                    onChange={(e) => handleInputChange("neurologicalDisorders", e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="hearing-vision">Нарушения слуха и/или зрения</Label>
                  <Input
                    id="hearing-vision"
                    value={formData.hearingVisionDisorders}
                    onChange={(e) => handleInputChange("hearingVisionDisorders", e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="chronic">Другие хронические заболевания</Label>
                  <Input
                    id="chronic"
                    value={formData.chronicDiseases}
                    onChange={(e) => handleInputChange("chronicDiseases", e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="speech-env">Случаи речевых нарушений в семье?</Label>
                  <Input
                    id="speech-env"
                    value={formData.speechEnvironment}
                    onChange={(e) => handleInputChange("speechEnvironment", e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Занимался ли ребёнок ранее с коррекционными педагогами и/или психологами?</Label>
                  <div className="mt-2 space-y-2">
                    {["Логопед", "Дефектолог", "Нейропсихолог", "Другое"].map(specialist => (
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
                  <div>
                    <Label htmlFor="speech-therapist">Заключение логопеда (при наличии)</Label>
                    <Input
                      id="speech-therapist"
                      value={formData.speechTherapistConclusion}
                      onChange={(e) => handleInputChange("speechTherapistConclusion", e.target.value)}
                      className="mt-2"
                    />
                  </div>
                )}

                {formData.previousSpecialists.includes("Нейропсихолог") && (
                  <div>
                    <Label htmlFor="neuropsychologist">Заключение нейропсихолога (при наличии)</Label>
                    <Input
                      id="neuropsychologist"
                      value={formData.neuropsychologistConclusion}
                      onChange={(e) => handleInputChange("neuropsychologistConclusion", e.target.value)}
                      className="mt-2"
                    />
                  </div>
                )}

                {formData.previousSpecialists.includes("Дефектолог") && (
                  <div>
                    <Label htmlFor="defectologist">Заключение дефектолога (при наличии)</Label>
                    <Input
                      id="defectologist"
                      value={formData.defectologistConclusion}
                      onChange={(e) => handleInputChange("defectologistConclusion", e.target.value)}
                      className="mt-2"
                    />
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
            )}

            {/* Навигация между страницами */}
            <div className="mt-8 flex justify-between">
              {currentPage > 1 && (
                <button
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Назад
                </button>
              )}

              {currentPage < 3 ? (
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="ml-auto px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                >
                  Далее
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="ml-auto px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Отправка..." : "Отправить"}
                </button>
              )}
            </div>

            {/* Индикатор страниц */}
            <div className="mt-6 flex justify-center gap-2">
              {[1, 2, 3].map(page => (
                <div
                  key={page}
                  className={`h-2 w-8 rounded-full ${
                    page === currentPage ? "bg-green-600" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}