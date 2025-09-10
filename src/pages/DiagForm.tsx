import { useState } from "react";
import Footer from "@/components/Footer";
import Icon from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    kindergarten: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}