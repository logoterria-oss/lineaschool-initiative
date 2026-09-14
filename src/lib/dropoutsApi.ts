const API_URL = 'https://functions.poehali.dev/4ff19097-3569-4d95-9f19-93784e6eb10d';

/** Ученик, который перестал заниматься */
export interface Dropout {
  id: number;
  name: string;
  /** Дата последнего занятия — она же дата ухода */
  left_at: string | null;
  /** Дата первого занятия */
  first_lesson: string | null;
  /** Сколько месяцев занимался до ухода */
  months: number;
  /** Педагоги регулярных занятий за последние 2 месяца */
  teachers: string[];
  /** Причина отказа со слов родителя */
  reason: string;
  /** Конфликты и проблемы */
  conflicts: string;
  /** Кто последним правил запись */
  updated_by: string;
}

const authHeaders = (extra: Record<string, string> = {}): Record<string, string> => {
  const token = localStorage.getItem('staff_token') || '';
  return token ? { ...extra, 'X-Auth-Token': token } : extra;
};

/** Список бросивших — отдаётся из кеша, поэтому открывается сразу */
export async function fetchDropouts(): Promise<{ students: Dropout[]; syncedAt: string | null }> {
  const r = await fetch(API_URL, { headers: authHeaders() });
  if (!r.ok) return { students: [], syncedAt: null };
  const data = await r.json().catch(() => ({}));
  return { students: data.students || [], syncedAt: data.synced_at || null };
}

/**
 * Пересчитать данные из CRM.
 * Тянет всю историю занятий, поэтому занимает до минуты — запускаем
 * только по кнопке, а не при каждом открытии раздела.
 */
export async function syncDropouts(): Promise<boolean> {
  const r = await fetch(`${API_URL}?action=sync`, { headers: authHeaders() });
  const data = await r.json().catch(() => ({}));
  return !!data.ok;
}

/** Сохранить причину ухода, конфликты и дату ухода */
export async function saveDropoutNote(p: {
  student_id: number;
  student_name: string;
  left_at: string | null;
  reason: string;
  conflicts: string;
}): Promise<boolean> {
  const r = await fetch(API_URL, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(p),
  });
  const data = await r.json().catch(() => ({}));
  return !!data.ok;
}

/** «2026-08-04» → «4 августа 2026» */
export function dropoutDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** «10.8» → «10,8 мес» — в отчётах привычнее запятая */
export function monthsText(m: number): string {
  if (!m) return '—';
  return `${String(m).replace('.', ',')} мес`;
}
