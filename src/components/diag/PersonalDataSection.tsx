import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useQuestionnaireSearch } from "@/hooks/useQuestionnaireSearch";

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
  const { searchByChildName, isLoading } = useQuestionnaireSearch();
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const calculateAge = (birthDate: string): string => {
    if (!birthDate) return '';
    
    const parts = birthDate.split(/[-./]/);
    if (parts.length !== 3) return '';
    
    const [year, month, day] = parts;
    const birth = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age.toString();
  };

  useEffect(() => {
    if (formData.childName.length >= 3) {
      if (searchTimeout) clearTimeout(searchTimeout);
      
      const timeout = setTimeout(async () => {
        const data = await searchByChildName(formData.childName);
        if (data) {
          onInputChange('parentName', data.parentName);
          onInputChange('phone', data.parentPhone);
          onInputChange('email', data.parentEmail);
          onInputChange('birthDate', data.birthDate);
          
          // Calculate age from birth date
          const calculatedAge = calculateAge(data.birthDate);
          if (calculatedAge) {
            onInputChange('age', calculatedAge);
          }
          
          // Fill only if value exists and not "Нет" or "no"
          if (data.grade && data.grade !== 'Нет' && data.grade !== 'no') {
            onInputChange('grade', data.grade);
          }
          
          if (data.educationType && data.educationType !== 'Нет' && data.educationType !== 'no') {
            onInputChange('educationType', data.educationType);
          }
          
          // Fill AOOP field - if variant exists use it, otherwise "Да" or "Нет"
          if (data.aoopRequired === 'yes') {
            if (data.aoopVariant && data.aoopVariant.trim()) {
              onInputChange('aoop', data.aoopVariant);
            } else {
              onInputChange('aoop', 'Да');
            }
          } else if (data.aoopRequired === 'no') {
            onInputChange('aoop', 'Нет');
          }
          
          if (data.schoolStartAge && data.schoolStartAge !== 'Нет' && data.schoolStartAge !== 'no') {
            onInputChange('schoolStartAge', data.schoolStartAge);
          }
          
          if (data.kindergarten && data.kindergarten !== 'Нет' && data.kindergarten !== 'no' && data.kindergarten === 'yes') {
            onInputChange('kindergarten', data.kindergarten);
          }
          
          // Anamnesis data - fill radio buttons and custom text fields
          // If "нет", "no", "другое" or empty - select "нет" radio, leave text field empty
          // If has real content - select "custom" radio and fill text
          if (data.prenatalDevelopment && data.prenatalDevelopment.trim() && 
              data.prenatalDevelopment !== 'Нет' && data.prenatalDevelopment !== 'no' &&
              data.prenatalDevelopment !== 'другое') {
            onInputChange('prenatalDevelopment', 'custom');
            onInputChange('prenatalDevelopmentCustom', data.prenatalDevelopment);
          } else {
            onInputChange('prenatalDevelopment', 'нет');
            onInputChange('prenatalDevelopmentCustom', '');
          }
          
          if (data.neurologicalDisorders && data.neurologicalDisorders.trim() && 
              data.neurologicalDisorders !== 'Нет' && data.neurologicalDisorders !== 'no' &&
              data.neurologicalDisorders !== 'другое') {
            onInputChange('neurologicalDisorders', 'custom');
            onInputChange('neurologicalDisordersCustom', data.neurologicalDisorders);
          } else {
            onInputChange('neurologicalDisorders', 'нет');
            onInputChange('neurologicalDisordersCustom', '');
          }
          
          if (data.hearingVisionDisorders && data.hearingVisionDisorders.trim() && 
              data.hearingVisionDisorders !== 'Нет' && data.hearingVisionDisorders !== 'no' &&
              data.hearingVisionDisorders !== 'другое') {
            onInputChange('hearingVisionDisorders', 'custom');
            onInputChange('hearingVisionDisordersCustom', data.hearingVisionDisorders);
          } else {
            onInputChange('hearingVisionDisorders', 'нет');
            onInputChange('hearingVisionDisordersCustom', '');
          }
          
          if (data.chronicDiseases && data.chronicDiseases.trim() && 
              data.chronicDiseases !== 'Нет' && data.chronicDiseases !== 'no' &&
              data.chronicDiseases !== 'другое') {
            onInputChange('chronicDiseases', 'custom');
            onInputChange('chronicDiseasesCustom', data.chronicDiseases);
          } else {
            onInputChange('chronicDiseases', 'нет');
            onInputChange('chronicDiseasesCustom', '');
          }
          
          if (data.speechEnvironment && data.speechEnvironment.trim() && 
              data.speechEnvironment !== 'Нет' && data.speechEnvironment !== 'no' &&
              data.speechEnvironment !== 'другое') {
            onInputChange('speechEnvironment', 'custom');
            onInputChange('speechEnvironmentCustom', data.speechEnvironment);
          } else {
            onInputChange('speechEnvironment', 'нет');
            onInputChange('speechEnvironmentCustom', '');
          }
          
          // Previous specialists - map from questionnaire format to diag form format
          if (data.previousSpecialists && data.previousSpecialists.length > 0) {
            const mappedSpecialists = data.previousSpecialists
              .map((s: string) => s.toLowerCase())
              .filter((s: string) => ['логопед', 'дефектолог', 'нейропсихолог'].includes(s));
            
            if (mappedSpecialists.length > 0) {
              onInputChange('previousSpecialists', mappedSpecialists);
              
              // Fill conclusion fields if they exist
              if (data.speechTherapistConclusion && data.speechTherapistConclusion.trim()) {
                onInputChange('speechTherapistConclusion', data.speechTherapistConclusion);
              }
              
              if (data.neuropsychologistConclusion && data.neuropsychologistConclusion.trim()) {
                onInputChange('neuropsychologistConclusion', data.neuropsychologistConclusion);
              }
              
              if (data.defectologistConclusion && data.defectologistConclusion.trim()) {
                onInputChange('defectologistConclusion', data.defectologistConclusion);
              }
            } else {
              onInputChange('previousSpecialists', ['нет']);
            }
          } else {
            onInputChange('previousSpecialists', ['нет']);
          }
          
          // Dominant hand
          if (data.dominantHand && ['right', 'left', 'retrained'].includes(data.dominantHand)) {
            onInputChange('dominantHand', data.dominantHand);
          }
        }
      }, 500);
      
      setSearchTimeout(timeout);
    }
    
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [formData.childName]);

  return (
    <section className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Персональные данные</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="childName">ФИО ребенка {isLoading && <span className="text-sm text-gray-500">(поиск...)</span>}</Label>
          <Input
            id="childName"
            value={formData.childName}
            onChange={(e) => onInputChange("childName", e.target.value)}
            className="mt-1"
            placeholder="Начните вводить ФИО для автозаполнения"
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
          <Select value={formData.age} onValueChange={(value) => onInputChange("age", value)}>
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
          <Select value={formData.grade} onValueChange={(value) => onInputChange("grade", value)}>
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
          <Select value={formData.educationType} onValueChange={(value) => onInputChange("educationType", value)}>
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
          <Select value={formData.schoolStartAge} onValueChange={(value) => onInputChange("schoolStartAge", value)}>
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
          <Select value={formData.kindergarten} onValueChange={(value) => onInputChange("kindergarten", value)}>
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
          <Input
            id="aoop"
            value={formData.aoop}
            onChange={(e) => onInputChange("aoop", e.target.value)}
            className="mt-1"
            placeholder='Введите вариант АООП или "Нет"'
          />
        </div>
      </div>
    </section>
  );
}