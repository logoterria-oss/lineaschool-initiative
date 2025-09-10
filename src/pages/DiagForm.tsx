import { useState } from "react";
import Footer from "@/components/Footer";
import Icon from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function DiagForm() {
  const [formData, setFormData] = useState({
    childName: "",
    birthDate: "",
    age: "",
    grade: "",
    parentName: "",
    phone: "",
    email: "",
    complaints: "",
    educationType: "",
    aoop: "",
    schoolStartAge: "",
    kindergarten: "",
    // Анамнестические данные
    prenatalDevelopment: "Без особенностей",
    prenatalDevelopmentCustom: "",
    neurologicalDisorders: "Нет / не диагностировано",
    neurologicalDisordersCustom: "",
    hearingVisionDisorders: "Нет / не диагностировано",
    hearingVisionDisordersCustom: "",
    chronicDiseases: "Нет / не диагностировано",
    chronicDiseasesCustom: "",
    speechEnvironment: "Нет",
    speechEnvironmentCustom: "",
    previousSpecialists: [] as string[],
    speechTherapistConclusion: "",
    defectologistConclusion: "",
    neuropsychologistConclusion: "",
    dominantHand: "",
    additionalInfo: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    const currentValues = formData[field as keyof typeof formData] as string[];
    if (checked) {
      handleInputChange(field, [...currentValues, value].join(','));
    } else {
      handleInputChange(field, currentValues.filter(item => item !== value).join(','));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation without booking button */}
      <nav className="bg-white shadow-sm border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center h-24">
            <a href="/" className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center">
                <Icon name="BookOpen" size={32} className="text-white" />
              </div>
              <span className="text-4xl font-bold text-green-600">LineaSchool</span>
            </a>
            <div className="hidden md:flex items-center space-x-6">
              <button 
                className="border border-green-500 text-green-600 hover:bg-green-50 text-lg px-8 py-4 rounded-md"
                onClick={() => window.open('https://wa.me/79236251611?text=Здравствуйте!%20У%20меня%20есть%20вопрос%20по%20коррекции%20дислексии%20и%20дисграфии', '_blank')}
              >
                Задать вопрос
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content placeholder */}
      <main className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Диагностическая форма</h1>
          
          <form className="space-y-8">
            {/* Персональные данные */}
            <section className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Персональные данные</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="childName">ФИО ребенка</Label>
                  <Input
                    id="childName"
                    value={formData.childName}
                    onChange={(e) => handleInputChange("childName", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="birthDate">Дата рождения</Label>
                  <Input
                    id="birthDate"
                    placeholder="__.__.____"
                    value={formData.birthDate}
                    onChange={(e) => handleInputChange("birthDate", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="age">Возраст</Label>
                  <Select onValueChange={(value) => handleInputChange("age", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Выберите возраст" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 12}, (_, i) => i + 7).map(age => (
                        <SelectItem key={age} value={age.toString()}>{age} лет</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="grade">Класс</Label>
                  <Select onValueChange={(value) => handleInputChange("grade", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Выберите класс" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 11}, (_, i) => i + 1).map(grade => (
                        <SelectItem key={grade} value={grade.toString()}>{grade} класс</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="parentName">ФИО родителя</Label>
                  <Input
                    id="parentName"
                    value={formData.parentName}
                    onChange={(e) => handleInputChange("parentName", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Номер телефона родителя</Label>
                  <Input
                    id="phone"
                    placeholder="+7(9__)___-__-__"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="educationType">Форма получения образования</Label>
                  <Select onValueChange={(value) => handleInputChange("educationType", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Выберите форму" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="school">в образовательной организации (школа, лицей, гимназия)</SelectItem>
                      <SelectItem value="special">в образовательной организации (коррекционная школа)</SelectItem>
                      <SelectItem value="homeschool">семейное образование</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="schoolStartAge">Возраст начала школьного обучения</Label>
                  <Select onValueChange={(value) => handleInputChange("schoolStartAge", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Выберите возраст" />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 6, 7, 8, 9].map(age => (
                        <SelectItem key={age} value={age.toString()}>{age} лет</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="kindergarten">Посещал ли ребенок детский сад</Label>
                  <Select onValueChange={(value) => handleInputChange("kindergarten", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Выберите ответ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Да</SelectItem>
                      <SelectItem value="no">Нет</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="complaints">Жалобы</Label>
                  <Textarea
                    id="complaints"
                    value={formData.complaints}
                    onChange={(e) => handleInputChange("complaints", e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="aoop">Реализуется ли АООП?</Label>
                  <Input
                    id="aoop"
                    value={formData.aoop}
                    onChange={(e) => handleInputChange("aoop", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </section>

            {/* Анамнестические данные */}
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
                        onChange={(e) => handleInputChange("prenatalDevelopment", e.target.value)}
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
                        onChange={(e) => handleInputChange("prenatalDevelopment", e.target.value)}
                        className="rounded"
                      />
                      <Label htmlFor="prenatal-custom">Другое:</Label>
                    </div>
                    {formData.prenatalDevelopment === "custom" && (
                      <Textarea
                        value={formData.prenatalDevelopmentCustom}
                        onChange={(e) => handleInputChange("prenatalDevelopmentCustom", e.target.value)}
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
                        onChange={(e) => handleInputChange("neurologicalDisorders", e.target.value)}
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
                        onChange={(e) => handleInputChange("neurologicalDisorders", e.target.value)}
                        className="rounded"
                      />
                      <Label htmlFor="neuro-custom">Есть:</Label>
                    </div>
                    {formData.neurologicalDisorders === "custom" && (
                      <Textarea
                        value={formData.neurologicalDisordersCustom}
                        onChange={(e) => handleInputChange("neurologicalDisordersCustom", e.target.value)}
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
                        onChange={(e) => handleInputChange("hearingVisionDisorders", e.target.value)}
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
                        onChange={(e) => handleInputChange("hearingVisionDisorders", e.target.value)}
                        className="rounded"
                      />
                      <Label htmlFor="hearing-custom">Есть:</Label>
                    </div>
                    {formData.hearingVisionDisorders === "custom" && (
                      <Textarea
                        value={formData.hearingVisionDisordersCustom}
                        onChange={(e) => handleInputChange("hearingVisionDisordersCustom", e.target.value)}
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
                        onChange={(e) => handleInputChange("chronicDiseases", e.target.value)}
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
                        onChange={(e) => handleInputChange("chronicDiseases", e.target.value)}
                        className="rounded"
                      />
                      <Label htmlFor="chronic-custom">Есть:</Label>
                    </div>
                    {formData.chronicDiseases === "custom" && (
                      <Textarea
                        value={formData.chronicDiseasesCustom}
                        onChange={(e) => handleInputChange("chronicDiseasesCustom", e.target.value)}
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
                        onChange={(e) => handleInputChange("speechEnvironment", e.target.value)}
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
                        onChange={(e) => handleInputChange("speechEnvironment", e.target.value)}
                        className="rounded"
                      />
                      <Label htmlFor="speech-custom">Есть:</Label>
                    </div>
                    {formData.speechEnvironment === "custom" && (
                      <Textarea
                        value={formData.speechEnvironmentCustom}
                        onChange={(e) => handleInputChange("speechEnvironmentCustom", e.target.value)}
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
                              handleInputChange("previousSpecialists", [...current, specialist]);
                            } else {
                              handleInputChange("previousSpecialists", current.filter(s => s !== specialist));
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
                      onChange={(e) => handleInputChange("speechTherapistConclusion", e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="defectologistConclusion">Заключение дефектолога</Label>
                    <Textarea
                      id="defectologistConclusion"
                      value={formData.defectologistConclusion}
                      onChange={(e) => handleInputChange("defectologistConclusion", e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="neuropsychologistConclusion">Заключение нейропсихолога</Label>
                    <Textarea
                      id="neuropsychologistConclusion"
                      value={formData.neuropsychologistConclusion}
                      onChange={(e) => handleInputChange("neuropsychologistConclusion", e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Ведущая рука */}
                <div>
                  <Label htmlFor="dominantHand">Ведущая рука</Label>
                  <Select onValueChange={(value) => handleInputChange("dominantHand", value)}>
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
                    onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
                    className="mt-1"
                    rows={4}
                  />
                </div>
              </div>
            </section>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}