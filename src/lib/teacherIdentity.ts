import {
  GROUP_TEACHERS,
  INDIVIDUAL_TEACHERS,
  TeacherOption,
  LessonForm,
} from './supervisionChecklist';

export interface TeacherIdentity {
  id: number;
  name: string;
  form: LessonForm;
}

const ALL: { t: TeacherOption; form: LessonForm }[] = [
  ...INDIVIDUAL_TEACHERS.map((t) => ({ t, form: 'individual' as LessonForm })),
  ...GROUP_TEACHERS.map((t) => ({ t, form: 'group' as LessonForm })),
];

// Нормализуем ФИО: нижний регистр, ё→е, слова по алфавиту.
// Так «Камнева Валерия» и «Валерия Камнева» дают одинаковый ключ.
function nameKey(full: string): string {
  return (full || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^а-яa-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ');
}

// Находит педагога из хардкод-списков по ФИО аккаунта (независимо от порядка слов).
export function findTeacherByName(fullName: string | undefined | null): TeacherIdentity | null {
  const key = nameKey(fullName || '');
  if (!key) return null;
  const hit = ALL.find(({ t }) => nameKey(t.name) === key);
  if (!hit) return null;
  return { id: hit.t.id, name: hit.t.name, form: hit.form };
}
