const API_URL = 'https://functions.poehali.dev/e918d9ee-1e71-4bc5-bcc0-3a7d69ac1a89';

export type DisputeStatus = 'none' | 'disputed';

export interface Violation {
  id: number;
  teacher_id: number;
  teacher_name: string;
  violation_date: string;
  violation_code: string;
  violation_title: string;
  penalty: string | null;
  admin_comment: string | null;
  dispute_status: DisputeStatus;
  dispute_comment: string | null;
  dispute_photos: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ViolationInput {
  id?: number;
  teacher_id: number;
  teacher_name: string;
  violation_date: string;
  violation_code: string;
  violation_title: string;
  penalty?: string | null;
  admin_comment?: string | null;
}

export const fetchViolations = async (params?: {
  teacher_id?: number;
  date_from?: string;
  date_to?: string;
}): Promise<Violation[]> => {
  const qs = new URLSearchParams();
  if (params?.teacher_id) qs.set('teacher_id', String(params.teacher_id));
  if (params?.date_from) qs.set('date_from', params.date_from);
  if (params?.date_to) qs.set('date_to', params.date_to);
  const url = qs.toString() ? `${API_URL}?${qs}` : API_URL;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Не удалось загрузить нарушения');
  const data = await res.json();
  return data.items as Violation[];
};

export const createViolation = async (input: ViolationInput) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Не удалось сохранить нарушение');
  return res.json();
};

export const updateViolation = async (input: ViolationInput) => {
  const res = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Не удалось обновить нарушение');
  return res.json();
};

export const disputeViolation = async (
  id: number,
  disputeComment: string,
  photos: string[],
) => {
  const res = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, action: 'dispute', dispute_comment: disputeComment, photos }),
  });
  if (!res.ok) throw new Error('Не удалось отправить оспаривание');
  return res.json();
};

export const deleteViolation = async (id: number) => {
  const res = await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Не удалось удалить нарушение');
  return res.json();
};
