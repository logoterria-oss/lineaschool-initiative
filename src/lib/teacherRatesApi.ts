import { LessonForm } from './supervisionChecklist';

const API = 'https://functions.poehali.dev/bcacc0da-c628-47c6-b8d4-2f4c4d46de02';

export interface TeacherRate {
  teacher_id: number;
  teacher_name: string;
  lesson_form: LessonForm;
  period_key: string;
  current_rate: number | null;
  planned_rate: number | null;
  planned_locked: boolean;
}

export interface TeacherRateInput {
  teacher_id: number;
  teacher_name: string;
  lesson_form: LessonForm;
  period_key: string;
  current_rate?: number | null;
  planned_rate?: number | null;
  planned_locked?: boolean;
}

export const fetchTeacherRates = async (): Promise<TeacherRate[]> => {
  const r = await fetch(API);
  const d = await r.json();
  if (!d?.success) throw new Error(d?.error || 'Не удалось загрузить ставки');
  return d.rates || [];
};

export const saveTeacherRate = async (input: TeacherRateInput): Promise<TeacherRate> => {
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const d = await r.json();
  if (!d?.success) throw new Error(d?.error || 'Не удалось сохранить ставку');
  return d.rate;
};

export const rateKey = (teacherId: number, form: LessonForm, periodKey: string) =>
  `${teacherId}-${form}-${periodKey}`;
