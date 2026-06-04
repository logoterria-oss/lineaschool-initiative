import { DiagData } from '@/types/DiagData';
import { formatValue } from '@/utils/diagUtils';
import { getCityTimezone } from '@/data/russianCities';

function shortenRegion(region: string): string {
  return region
    .replace(/\s*-\s*Кузбасс/i, '')
    .replace(/\bобласть\b/gi, 'обл')
    .replace(/\bкрай\b/gi, 'край')
    .replace(/\bреспублика\b/gi, 'респ')
    .replace(/\bавтономный округ\b/gi, 'АО')
    .replace(/\bавтономная область\b/gi, 'АО')
    .trim();
}

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
        {diagData.city && (
          <div>
            <strong>Населённый пункт:</strong> {diagData.city}
            {(() => {
              const tz = getCityTimezone(diagData.city);
              const region = diagData.cityRegion ? shortenRegion(diagData.cityRegion) : '';
              if (!region && !tz) return null;
              const parts = [region, tz].filter(Boolean).join(', ');
              return <span className="text-gray-500 text-sm ml-1 print:text-gray-700">({parts})</span>;
            })()}
          </div>
        )}
        <div><strong>Тип образования:</strong> {formatValue(diagData.educationType)}</div>
        <div><strong>АООП:</strong> {formatValue(diagData.aoop)}</div>
        <div><strong>Возраст поступления в школу:</strong> {diagData.schoolStartAge}</div>
        {diagData.kindergarten && (
          <div><strong>Детский сад:</strong> {formatValue(diagData.kindergarten)}</div>
        )}
      </div>
      {diagData.complaints && (
        <div className="mt-4">
          <strong>Жалобы:</strong> "{diagData.complaints}"
        </div>
      )}
    </section>
  );
}