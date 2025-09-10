import { DiagData } from '@/types/DiagData';
import { formatValue } from '@/utils/diagUtils';

interface PersonalDataViewProps {
  diagData: DiagData;
}

export default function PersonalDataView({ diagData }: PersonalDataViewProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
        Персональные данные
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div><strong>ФИО ребенка:</strong> {diagData.childName}</div>
        <div><strong>Дата рождения:</strong> {diagData.birthDate}</div>
        <div><strong>Возраст:</strong> {diagData.age}</div>
        <div><strong>Класс:</strong> {diagData.grade}</div>
        <div><strong>ФИО родителя:</strong> {diagData.parentName}</div>
        <div><strong>Телефон:</strong> {diagData.phone}</div>
        <div><strong>Email:</strong> {diagData.email}</div>
        <div><strong>Тип образования:</strong> {formatValue(diagData.educationType)}</div>
        <div><strong>АООП:</strong> {formatValue(diagData.aoop)}</div>
        <div><strong>Возраст поступления в школу:</strong> {diagData.schoolStartAge}</div>
        <div><strong>Детский сад:</strong> {formatValue(diagData.kindergarten)}</div>
      </div>
      {diagData.complaints && (
        <div className="mt-4">
          <strong>Жалобы:</strong> {diagData.complaints}
        </div>
      )}
    </section>
  );
}