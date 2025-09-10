import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface FormData {
  // Персональные данные
  childName: string;
  birthDate: string;
  age: string;
  grade: string;
  parentName: string;
  phone: string;
  email: string;
  complaints: string;
  educationForm: string;
  aoop: string;
  schoolStartAge: string;
  kindergarten: string;

  // Анамнестические данные
  prenatalDevelopment: string;
  neurologicalDiseases: string;
  hearingVisionDisorders: string;
  chronicDiseases: string;
  speechEnvironment: string;
  previousTherapy: string[];
  logopedConclusion: string;
  defectologistConclusion: string;
  neuropsychologistConclusion: string;
  dominantHand: string;
  additionalInfo: string;

  // Экспрессивная речь
  motorRealization: string[];
  wordFormation: string[];
  grammaticalStructure: string;
  connectedSpeech: string[];
  nominativeFunction: string[];

  // Импрессивная речь
  understandingWords: string;
  complexConstructions: string;
  phonematicPerception: string;

  // Письменная речь
  languageAnalysis: string[];
  readingSkill: string[];
  readingSpeed: string;
  readingComprehension: string;
  writtenSamples: File[];
  dysgraphicErrors: string;
  analysisErrors: string[];
  acousticErrors: string[];
  motorErrors: string[];
  visualMotorErrors: string[];
  spatialErrors: string[];
  additionalWritingFeatures: string[];
  regulationViolations: string[];

  // Заключение
  conclusion: string[];

  // Рекомендации
  recommendations: string[];

  // Направления работы
  workDirections: string[];

  // Дата и логопед
  diagnosisDate: string;
  logopedist: string;
}

const DiagForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    childName: '',
    birthDate: '',
    age: '',
    grade: '',
    parentName: '',
    phone: '',
    email: '',
    complaints: '',
    educationForm: '',
    aoop: '',
    schoolStartAge: '',
    kindergarten: '',
    prenatalDevelopment: '',
    neurologicalDiseases: '',
    hearingVisionDisorders: '',
    chronicDiseases: '',
    speechEnvironment: '',
    previousTherapy: [],
    logopedConclusion: '',
    defectologistConclusion: '',
    neuropsychologistConclusion: '',
    dominantHand: '',
    additionalInfo: '',
    motorRealization: [],
    wordFormation: [],
    grammaticalStructure: '',
    connectedSpeech: [],
    nominativeFunction: [],
    understandingWords: '',
    complexConstructions: '',
    phonematicPerception: '',
    languageAnalysis: [],
    readingSkill: [],
    readingSpeed: '',
    readingComprehension: '',
    writtenSamples: [],
    dysgraphicErrors: '',
    analysisErrors: [],
    acousticErrors: [],
    motorErrors: [],
    visualMotorErrors: [],
    spatialErrors: [],
    additionalWritingFeatures: [],
    regulationViolations: [],
    conclusion: [],
    recommendations: [],
    workDirections: [],
    diagnosisDate: new Date().toLocaleDateString('ru-RU'),
    logopedist: ''
  });

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: keyof FormData, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...(prev[field] as string[]), value]
        : (prev[field] as string[]).filter(item => item !== value)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const diagId = Date.now();
    localStorage.setItem(`diag_${diagId}`, JSON.stringify(formData));
    navigate(`/diag_${diagId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header hideBookButton={true} />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold text-center mb-8">Форма диагностических данных</h1>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Персональные данные */}
            <Card>
              <CardHeader>
                <CardTitle>Персональные данные</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="childName">ФИО ребенка</Label>
                    <Input
                      id="childName"
                      value={formData.childName}
                      onChange={(e) => handleInputChange('childName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="birthDate">Дата рождения</Label>
                    <Input
                      id="birthDate"
                      placeholder="__.__.____"
                      value={formData.birthDate}
                      onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">Возраст</Label>
                    <Select value={formData.age} onValueChange={(value) => handleInputChange('age', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите возраст" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 5).map(age => (
                          <SelectItem key={age} value={age.toString()}>{age} лет</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="grade">Класс</Label>
                    <Select value={formData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите класс" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 11 }, (_, i) => i + 1).map(grade => (
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
                      onChange={(e) => handleInputChange('parentName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Номер телефона родителя</Label>
                    <Input
                      id="phone"
                      placeholder="+7(9__)___-__-__"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="complaints">Жалобы</Label>
                  <Textarea
                    id="complaints"
                    value={formData.complaints}
                    onChange={(e) => handleInputChange('complaints', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="educationForm">Форма получения образования</Label>
                    <Select value={formData.educationForm} onValueChange={(value) => handleInputChange('educationForm', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите форму" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="school">в образовательной организации (школа, лицей, гимназия)</SelectItem>
                        <SelectItem value="correctional">в образовательной организации (коррекционная школа)</SelectItem>
                        <SelectItem value="family">семейное образование</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="schoolStartAge">Возраст начала школьного обучения</Label>
                    <Select value={formData.schoolStartAge} onValueChange={(value) => handleInputChange('schoolStartAge', value)}>
                      <SelectTrigger>
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
                    <Select value={formData.kindergarten} onValueChange={(value) => handleInputChange('kindergarten', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите вариант" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Да</SelectItem>
                        <SelectItem value="no">Нет</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="aoop">Реализуется ли АООП?</Label>
                  <Input
                    id="aoop"
                    value={formData.aoop}
                    onChange={(e) => handleInputChange('aoop', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Анамнестические данные */}
            <Card>
              <CardHeader>
                <CardTitle>Анамнестические данные</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="prenatalDevelopment">Особенности пренатального развития</Label>
                  <Input
                    id="prenatalDevelopment"
                    placeholder="без особенностей"
                    value={formData.prenatalDevelopment}
                    onChange={(e) => handleInputChange('prenatalDevelopment', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="neurologicalDiseases">Неврологические заболевания и/или психические расстройства</Label>
                  <Input
                    id="neurologicalDiseases"
                    placeholder="нет / не диагностировано"
                    value={formData.neurologicalDiseases}
                    onChange={(e) => handleInputChange('neurologicalDiseases', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="hearingVisionDisorders">Нарушения слуха и/или зрения</Label>
                  <Input
                    id="hearingVisionDisorders"
                    placeholder="нет / не диагностировано"
                    value={formData.hearingVisionDisorders}
                    onChange={(e) => handleInputChange('hearingVisionDisorders', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="chronicDiseases">Другие хронические заболевания</Label>
                  <Input
                    id="chronicDiseases"
                    placeholder="нет / не диагностировано"
                    value={formData.chronicDiseases}
                    onChange={(e) => handleInputChange('chronicDiseases', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="speechEnvironment">Речевое окружение, случаи речевых нарушений в семье</Label>
                  <Input
                    id="speechEnvironment"
                    placeholder="нет"
                    value={formData.speechEnvironment}
                    onChange={(e) => handleInputChange('speechEnvironment', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Занимался ли с логопедом/дефектологом/нейропсихологом ранее</Label>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {['нет', 'логопед', 'дефектолог', 'нейропсихолог'].map(option => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`therapy-${option}`}
                          checked={formData.previousTherapy.includes(option)}
                          onCheckedChange={(checked) => handleCheckboxChange('previousTherapy', option, checked as boolean)}
                        />
                        <Label htmlFor={`therapy-${option}`}>{option}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="logopedConclusion">Заключение логопеда</Label>
                    <Textarea
                      id="logopedConclusion"
                      value={formData.logopedConclusion}
                      onChange={(e) => handleInputChange('logopedConclusion', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="defectologistConclusion">Заключение дефектолога</Label>
                    <Textarea
                      id="defectologistConclusion"
                      value={formData.defectologistConclusion}
                      onChange={(e) => handleInputChange('defectologistConclusion', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="neuropsychologistConclusion">Заключение нейропсихолога</Label>
                    <Textarea
                      id="neuropsychologistConclusion"
                      value={formData.neuropsychologistConclusion}
                      onChange={(e) => handleInputChange('neuropsychologistConclusion', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dominantHand">Ведущая рука</Label>
                    <Select value={formData.dominantHand} onValueChange={(value) => handleInputChange('dominantHand', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите вариант" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="right">правша</SelectItem>
                        <SelectItem value="left">левша</SelectItem>
                        <SelectItem value="retrained">правша (переученный левша)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="additionalInfo">Дополнительные сведения</Label>
                  <Textarea
                    id="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Дата и логопед */}
            <Card>
              <CardHeader>
                <CardTitle>Информация о диагностике</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="diagnosisDate">Дата диагностики</Label>
                    <Input
                      id="diagnosisDate"
                      value={formData.diagnosisDate}
                      onChange={(e) => handleInputChange('diagnosisDate', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="logopedist">Логопед-диагност</Label>
                    <Select value={formData.logopedist} onValueChange={(value) => handleInputChange('logopedist', value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите логопеда" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="abramenko">Абраменко Виктория</SelectItem>
                        <SelectItem value="naidenova">Найденова Анастасия</SelectItem>
                        <SelectItem value="eremina">Еремина Дарья</SelectItem>
                        <SelectItem value="yanovets">Яновець Мила</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center pt-8">
              <Button type="submit" className="px-8 py-3 text-lg">
                Отправить
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DiagForm;