import { LessonForm, calcTotalScore } from './supervisionChecklist';

const API_URL = 'https://functions.poehali.dev/c3d6e0e1-692e-4133-9442-9d5e01c95ca3';

export interface Supervision {
  id: number;
  lesson_form: LessonForm;
  teacher_id: number;
  teacher_name: string;
  supervision_date: string;
  lesson_date: string | null;
  lesson_link: string | null;
  lesson_structure: string | null;
  scores: Record<string, number>;
  reviewer_comment: string | null;
  total_score: number;
  student_id: number | null;
  student_name: string | null;
  student_age: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface SupervisionInput {
  id?: number;
  lesson_form: LessonForm;
  teacher_id: number;
  teacher_name: string;
  supervision_date: string;
  lesson_date?: string | null;
  lesson_link?: string | null;
  lesson_structure?: string | null;
  scores: Record<string, number>;
  reviewer_comment?: string | null;
  student_id?: number | null;
  student_name?: string | null;
  student_age?: number | null;
}

export const fetchSupervisions = async (params?: {
  teacher_id?: number;
  date_from?: string;
  date_to?: string;
}): Promise<Supervision[]> => {
  const qs = new URLSearchParams();
  if (params?.teacher_id) qs.set('teacher_id', String(params.teacher_id));
  if (params?.date_from) qs.set('date_from', params.date_from);
  if (params?.date_to) qs.set('date_to', params.date_to);
  const url = qs.toString() ? `${API_URL}?${qs}` : API_URL;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Не удалось загрузить супервизии');
  const data = await res.json();
  return data.items as Supervision[];
};

export const createSupervision = async (input: SupervisionInput) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, total_score: calcTotalScore(input.scores) }),
  });
  if (!res.ok) throw new Error('Не удалось сохранить супервизию');
  return res.json();
};

export const updateSupervision = async (input: SupervisionInput) => {
  const res = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, total_score: calcTotalScore(input.scores) }),
  });
  if (!res.ok) throw new Error('Не удалось обновить супервизию');
  return res.json();
};

export const deleteSupervision = async (id: number) => {
  const res = await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Не удалось удалить супервизию');
  return res.json();
};