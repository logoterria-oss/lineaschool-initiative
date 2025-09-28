import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PersonalDataSectionProps {
  formData: {
    childName: string;
    birthDate: string;
    age: string;
    grade: string;
    parentName: string;
    phone: string;
    email: string;
    complaints: string;
    educationType: string;
    aoop: string;
    schoolStartAge: string;
    kindergarten: string;
  };
  onInputChange: (field: string, value: string) => void;
}

export default function PersonalDataSection({ formData, onInputChange }: PersonalDataSectionProps) {
  return (
    <section className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Персональные данные</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="childName">ФИО ребенка</Label>
          <Input
            id="childName"
            value={formData.childName}
            onChange={(e) => onInputChange("childName", e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="birthDate">Дата рождения</Label>
          <Input
            id="birthDate"
            placeholder="__.__.____"
            value={formData.birthDate}
            onChange={(e) => onInputChange("birthDate", e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="age">Возраст</Label>
          <Select onValueChange={(value) => onInputChange("age", value)}>
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
          <Select onValueChange={(value) => onInputChange("grade", value)}>
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
            onChange={(e) => onInputChange("parentName", e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="phone">Номер телефона родителя</Label>
          <Input
            id="phone"
            placeholder="+7(9__)___-__-__"
            value={formData.phone}
            onChange={(e) => onInputChange("phone", e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onInputChange("email", e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="educationType">Форма получения образования</Label>
          <Select onValueChange={(value) => onInputChange("educationType", value)}>
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
          <Select onValueChange={(value) => onInputChange("schoolStartAge", value)}>
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
          <Select onValueChange={(value) => onInputChange("kindergarten", value)}>
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
            onChange={(e) => onInputChange("complaints", e.target.value)}
            className="mt-1"
            rows={3}
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="aoop">Реализуется ли АООП?</Label>
          <Select value={formData.aoop} onValueChange={(value) => onInputChange("aoop", value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Выберите ответ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Да">Да</SelectItem>
              <SelectItem value="Нет">Нет</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}