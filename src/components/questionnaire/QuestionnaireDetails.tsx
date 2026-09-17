import { useState, useEffect } from 'react';
import { getCityTimezone } from '@/data/russianCities';

export const QUESTIONNAIRE_API = 'https://functions.poehali.dev/65751635-528e-4830-bc09-e0b9c5344580';

const translateValue = (value: string | undefined): string => {
  if (!value) return '';
  const translations: Record<string, string> = {
    yes: 'Да',
    no: 'Нет',
    school: 'Общеобразовательная школа / лицей / гимназия',
    special: 'Коррекционная школа',
    correctional: 'Коррекционная школа',
    homeschool: 'Семейное образование',
    family: 'Семейное образование',
    other: 'Другое',
    right: 'Правша',
    left: 'Левша',
    retrained: 'Правша (переученный левша)',
    ambidextrous: 'Амбидекстр',
  };
  return translations[value] || value;
};

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-semibold text-gray-900 mb-3">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function Field({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;

  return (
    <div className="text-sm">
      <span className="font-medium text-gray-700">{label}:</span>{' '}
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

/** Ответы анкеты. Используется и в списке админки, и на постоянной странице /anketa/:id. */
export default function QuestionnaireDetails({
  responseId,
  showHeader = false,
}: {
  responseId: number | string;
  showHeader?: boolean;
}) {
  const [details, setDetails] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${QUESTIONNAIRE_API}?id=${responseId}`);
        if (response.ok && !cancelled) {
          setDetails(await response.json());
        } else if (!cancelled) {
          setDetails(null);
        }
      } catch (error) {
        console.error('Ошибка загрузки деталей:', error);
        if (!cancelled) setDetails(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchDetails();
    return () => {
      cancelled = true;
    };
  }, [responseId]);

  if (isLoading) {
    return <div className="text-center py-4 text-gray-600">Загрузка...</div>;
  }

  if (!details || !details.id) {
    return <div className="text-center py-4 text-gray-600">Анкета не найдена</div>;
  }

  const str = (v: unknown) => (v ? String(v) : undefined);
  const specialists = (details.previous_specialists as string[] | undefined) || [];
  const city = str(details.city);

  return (
    <div className="space-y-6">
      {showHeader && (
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{str(details.child_name)}</h1>
          <p className="text-gray-600 mt-1">
            Родитель: {str(details.parent_name)}
            {details.created_at
              ? ` · заполнена ${new Date(String(details.created_at)).toLocaleDateString('ru-RU')}`
              : ''}
          </p>
        </div>
      )}

      <Section title="Контактные данные">
        <Field label="Телефон" value={str(details.parent_phone)} />
        <Field label="E-mail" value={str(details.parent_email)} />
        {city ? (
          <Field
            label="Населённый пункт"
            value={`${city}${getCityTimezone(city) ? ` (${getCityTimezone(city)})` : ''}`}
          />
        ) : null}
      </Section>

      <Section title="Ребёнок">
        <Field label="ФИО" value={str(details.child_name)} />
        <Field label="Дата рождения" value={str(details.birth_date)} />
        <Field label="Класс" value={str(details.grade)} />
      </Section>

      <Section title="Образование">
        <Field label="Форма обучения" value={translateValue(str(details.education_type))} />
        <Field label="АООП" value={translateValue(str(details.aoop_required))} />
        {details.aoop_required === 'yes' && (
          <Field label="Вариант АООП" value={str(details.aoop_variant)} />
        )}
        <Field
          label="Возраст поступления в школу"
          value={str(details.school_start_age) ? `${str(details.school_start_age)} лет` : undefined}
        />
        <Field label="Детский сад" value={translateValue(str(details.kindergarten))} />
      </Section>

      <Section title="Анамнез">
        <Field
          label="Перинатальное развитие"
          value={str(details.prenatal_development) || (details.prenatal_no_features ? 'Без особенностей' : undefined)}
        />
        <Field
          label="Развитие в первые 3 года"
          value={str(details.early_development) || (details.early_dev_no_features ? 'Без особенностей' : undefined)}
        />
        <Field
          label="Неврологические заболевания"
          value={str(details.neurological_disorders) || (details.neurological_none ? 'Нет / не диагностировано' : undefined)}
        />
        <Field
          label="Нарушения слуха/зрения"
          value={str(details.hearing_vision_disorders) || (details.hearing_vision_none ? 'Нет / не диагностировано' : undefined)}
        />
        <Field
          label="Хронические заболевания"
          value={str(details.chronic_diseases) || (details.chronic_none ? 'Нет / не диагностировано' : undefined)}
        />
        <Field
          label="Речевые нарушения в семье"
          value={str(details.speech_environment) || (details.speech_env_none ? 'Нет / не диагностировано' : undefined)}
        />
      </Section>

      <Section title="Специалисты">
        {specialists.length > 0 ? (
          <Field label="Занимался с" value={specialists.join(', ')} />
        ) : (
          <Field label="Занимался с" value="Нет" />
        )}
        {specialists.includes('Логопед') && (
          <>
            <Field label="Заключение логопеда" value={str(details.speech_therapist_conclusion)} />
            {details.speech_therapist_current && <Field label="Статус" value="Занимается сейчас" />}
          </>
        )}
        {specialists.includes('Дефектолог') && (
          <>
            <Field label="Заключение дефектолога" value={str(details.defectologist_conclusion)} />
            {details.defectologist_current && <Field label="Статус" value="Занимается сейчас" />}
          </>
        )}
        {specialists.includes('Нейропсихолог') && (
          <>
            <Field label="Заключение нейропсихолога" value={str(details.neuropsychologist_conclusion)} />
            {details.neuropsychologist_current && <Field label="Статус" value="Занимается сейчас" />}
          </>
        )}
        {specialists.includes('Другое') && (
          <>
            <Field label="Другой специалист" value={str(details.other_specialist_name)} />
            {details.other_specialist_current && <Field label="Статус" value="Занимается сейчас" />}
          </>
        )}
      </Section>

      <Section title="Дополнительно">
        <Field label="Ведущая рука" value={translateValue(str(details.dominant_hand))} />
      </Section>
    </div>
  );
}
