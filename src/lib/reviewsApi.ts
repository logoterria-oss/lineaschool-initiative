const API_URL = 'https://functions.poehali.dev/5a887385-edc1-4860-8b71-9a1354a6bee5';

/** Направление отзыва */
export type ReviewKind = 'improve' | 'free_lesson';

/** Отзыв, присланный мессенджером */
export interface Review {
  id: number;
  kind: ReviewKind;
  author_name: string;
  phone: string;
  text: string;
  rating: number | null;
  status: string;
  source: string;
  /** Всё присланное как есть — структура полей ещё уточняется */
  payload: Record<string, unknown>;
  created_at: string;
}

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('staff_token') || '';
  return token ? { 'X-Auth-Token': token } : {};
};

/** Отзывы по направлению */
export async function fetchReviews(kind: ReviewKind): Promise<Review[]> {
  const r = await fetch(`${API_URL}?kind=${kind}`, { headers: authHeaders() });
  if (!r.ok) return [];
  const data = await r.json().catch(() => ({}));
  return data.reviews || [];
}
