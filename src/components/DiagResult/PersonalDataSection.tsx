import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PersonalDataSectionProps {
  diagData: {
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
  };
}

const PersonalDataSection = ({ diagData }: PersonalDataSectionProps) => {
  const formatEducationForm = (value: string) => {
    const forms = {
      'school': 'в образовательной организации (школа, лицей, гимназия)',
      'correctional': 'в образовательной организации (коррекционная школа)',
      'family': 'семейное образование'
    };
    return forms[value as keyof typeof forms] || value;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Персональные данные</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p><strong>ФИО ребенка:</strong> {diagData.childName}</p>
          <p><strong>Дата рождения:</strong> {diagData.birthDate}</p>
          <p><strong>Возраст:</strong> {diagData.age} лет</p>
          <p><strong>Класс:</strong> {diagData.grade} класс</p>
          <p><strong>ФИО родителя:</strong> {diagData.parentName}</p>
          <p><strong>Телефон:</strong> {diagData.phone}</p>
          <p><strong>E-mail:</strong> {diagData.email}</p>
        </div>
        {diagData.complaints && (
          <p><strong>Жалобы:</strong> {diagData.complaints}</p>
        )}
        <p><strong>Форма получения образования:</strong> {formatEducationForm(diagData.educationForm)}</p>
        {diagData.aoop && (
          <p><strong>Реализуется ли АООП:</strong> {diagData.aoop}</p>
        )}
        <p><strong>Возраст начала школьного обучения:</strong> {diagData.schoolStartAge} лет</p>
        <p><strong>Посещал ли детский сад:</strong> {diagData.kindergarten === 'yes' ? 'Да' : 'Нет'}</p>
      </CardContent>
    </Card>
  );
};

export default PersonalDataSection;