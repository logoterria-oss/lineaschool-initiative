const TEACHER_SCHEDULE_URL = 'https://functions.poehali.dev/6dcf4744-e843-45cf-9614-9afe432b92f5';

export type AbsenceKind = 'dayoff' | 'vacation';

export interface Absence {
  id: number;
  teacher_id: number;
  kind: AbsenceKind;
  date_from: string;
  date_to: string;
  time_from: string | null;
  time_to: string | null;
  note?: string;
}

export const fetchAbsences = async (teacherId: number): Promise<Absence[]> => {
  const res = await fetch(`${TEACHER_SCHEDULE_URL}?resource=absences&teacher_id=${teacherId}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.absences as Absence[]) || [];
};

export const addAbsence = async (input: {
  teacher_id: number;
  kind: AbsenceKind;
  date_from: string;
  date_to?: string;
  time_from?: string | null;
  time_to?: string | null;
}): Promise<Absence | null> => {
  const res = await fetch(`${TEACHER_SCHEDULE_URL}?resource=absences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  return data.absence || null;
};

export const deleteAbsence = async (id: number): Promise<boolean> => {
  const res = await fetch(`${TEACHER_SCHEDULE_URL}?resource=absences&id=${id}`, {
    method: 'DELETE',
  });
  return res.ok;
};
