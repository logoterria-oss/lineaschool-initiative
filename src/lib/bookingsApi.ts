export const BOOKINGS_URL = 'https://functions.poehali.dev/1f1f495f-752e-4470-b50c-51490b382f89';

export type BookingStatus = 'new' | 'confirmed' | 'rejected';

export interface BookingLink {
  id: number;
  token: string;
  title: string;
  note: string;
  parentName: string;
  childName: string;
  phone: string;
  active: boolean;
  /** Общая ссылка: одна на всех, имя ребёнка вводит родитель */
  isPublic: boolean;
  expiresAt: string | null;
  maxBookings: number;
  createdBy: string;
  createdAt: string | null;
  bookingsCount: number;
}

export interface Booking {
  id: number;
  token: string;
  date: string;
  dateRu: string;
  weekdayName: string;
  timeFrom: string;
  timeTo: string;
  teacherId: number;
  teacherName: string;
  childName: string;
  parentName: string;
  phone: string;
  comment: string;
  /** Номер заявки: занятия одной отправки объединяются в карточку */
  batchId: string | null;
  /** Все занятия этой заявки (в списке администратора) */
  lessons?: Booking[];
  lessonType: LessonType;
  startFrom: string | null;
  status: BookingStatus;
  statusLabel: string;
  adminNote: string;
  dialogId: number | null;
  createdAt: string | null;
  processedAt: string | null;
  processedBy: string;
  /** Ребёнок уже заведён в эту группу в CRM — в расписании бронь не дублируем */
  inCrm?: boolean;
}

export type LessonType = 'individual' | 'groups';

/** Педагог, свободный в это время */
export interface SlotTeacher {
  teacherId: number;
  teacherName: string;
  availableFrom?: string | null;
  /** Педагог в отпуске — занятия ведёт этот коллега */
  substituteName?: string | null;
  /** Последний день замены (ISO) */
  substituteUntil?: string | null;
}

/** Индивидуальное окно: время + список свободных педагогов */
export interface FreeSlot {
  timeFrom: string;
  timeTo: string;
  teachers: SlotTeacher[];
}

/** Групповое занятие со свободными местами */
export interface GroupSlot {
  timeFrom: string;
  timeTo: string;
  teacherId: number;
  teacherName: string;
  free: number;
  maxSize: number;
  availableFrom?: string | null;
  ageLabel?: string;
}

export interface FreeDay {
  dayOffset: number;
  date: string;
  dateRu: string;
  weekday: number;
  weekdayName: string;
  slots: FreeSlot[];
}

export interface GroupDay {
  dayOffset: number;
  date: string;
  dateRu: string;
  weekday: number;
  weekdayName: string;
  groups: GroupSlot[];
}

const json = async (res: Response) => {
  try {
    return await res.json();
  } catch {
    return {};
  }
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Быстрая проверка ссылки — без тяжёлого расписания.
 *  Сетевой сбой или перегрузка сервера (не ответ «ссылки нет») повторяем
 *  несколько раз: раньше из-за этого страницу приходилось обновлять вручную. */
export const checkBookingLink = async (
  token: string,
): Promise<{ link?: BookingLink; limitReached?: boolean; error?: string; message?: string; network?: boolean }> => {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(`${BOOKINGS_URL}?action=check&token=${encodeURIComponent(token)}`);
      const data = await json(res);
      if (data.link || data.error) return data;
    } catch {
      // сеть — пробуем ещё раз
    }
    await sleep(700 * (attempt + 1));
  }
  return { network: true };
};

// ── Родитель ──────────────────────────────────────────────────────────────────

export const fetchBookingSlots = async (
  token: string,
  startFrom: string,
  lessonType: LessonType,
): Promise<{
  link?: BookingLink;
  startFrom?: string;
  minDate?: string;
  individualDays: FreeDay[];
  groupDays: GroupDay[];
  doneIndividual?: boolean;
  doneGroups?: boolean;
  limitReached?: boolean;
  error?: string;
  message?: string;
}> => {
  // Один тип за запрос: расписание тяжёлое, вместе не успевает ответить
  try {
    const res = await fetch(
      `${BOOKINGS_URL}?action=slots&token=${encodeURIComponent(token)}` +
        `&start_from=${startFrom}&lesson_type=${lessonType}`,
    );
    const data = await json(res);
    return { individualDays: [], groupDays: [], ...data };
  } catch {
    return { individualDays: [], groupDays: [] };
  }
};

/** Оба расписания сразу — двумя параллельными запросами.
 *
 * Расписание тяжёлое, и запрос иногда не успевает ответить. Молча показать
 * половину разделов нельзя: родитель решит, что групп нет вовсе. Поэтому
 * каждый тип пробуем дважды.
 */
export const fetchAllBookingSlots = async (token: string, startFrom: string) => {
  const load = async (type: LessonType) => {
    let last = await fetchBookingSlots(token, startFrom, type);
    for (let i = 0; i < 2 && !last.link && !last.error; i++) {
      await sleep(800);
      last = await fetchBookingSlots(token, startFrom, type);
    }
    return last;
  };

  const [ind, grp] = await Promise.all([load('individual'), load('groups')]);
  const base = ind.link ? ind : grp;
  return {
    ...base,
    // Если тип не ответил даже со второй попытки — честно говорим об этом,
    // а не притворяемся, что свободного времени нет
    individualFailed: !ind.link && !ind.error,
    groupsFailed: !grp.link && !grp.error,
    individualDays: ind.individualDays || [],
    groupDays: grp.groupDays || [],
  };
};

/** Одно выбранное окно */
export interface BookingSlotInput {
  date: string;
  timeFrom: string;
  timeTo: string;
  teacherId: number;
  teacherName: string;
  lessonType: LessonType;
}

export const createBooking = async (input: {
  token: string;
  childName: string;
  parentName?: string;
  phone?: string;
  comment?: string;
  startFrom?: string;
  /** Все выбранные занятия — одной заявкой */
  slots: BookingSlotInput[];
}): Promise<{
  ok?: boolean;
  booking?: Booking;
  bookings?: Booking[];
  error?: string;
  message?: string;
}> => {
  const res = await fetch(`${BOOKINGS_URL}?action=book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return json(res);
};

// ── Админ ─────────────────────────────────────────────────────────────────────

export const fetchBookings = async (
  status: BookingStatus | 'all' = 'all',
  matchCrm = false,
): Promise<{ bookings: Booking[]; newCount: number }> => {
  const res = await fetch(
    `${BOOKINGS_URL}?action=bookings&status=${status}${matchCrm ? '&match_crm=1' : ''}`,
  );
  const data = await json(res);
  return { bookings: data.bookings || [], newCount: data.newCount || 0 };
};

export const setBookingStatus = async (
  id: number,
  status: BookingStatus,
  processedBy?: string,
  adminNote?: string,
): Promise<Booking | null> => {
  const res = await fetch(`${BOOKINGS_URL}?action=set-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status, processedBy, adminNote }),
  });
  const data = await json(res);
  return data.booking || null;
};

export const fetchBookingLinks = async (): Promise<BookingLink[]> => {
  const res = await fetch(`${BOOKINGS_URL}?action=links`);
  const data = await json(res);
  return data.links || [];
};

export const createBookingLink = async (input: {
  title?: string;
  note?: string;
  parentName?: string;
  childName?: string;
  phone?: string;
  expiresAt?: string | null;
  maxBookings?: number;
  createdBy?: string;
}): Promise<BookingLink | null> => {
  const res = await fetch(`${BOOKINGS_URL}?action=create-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await json(res);
  return data.link || null;
};

/** Общая ссылка школы: создаётся один раз, дальше отдаётся та же */
export const fetchPublicLink = async (createdBy?: string): Promise<BookingLink | null> => {
  const res = await fetch(`${BOOKINGS_URL}?action=public-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ createdBy }),
  });
  const data = await json(res);
  return data.link || null;
};

export const toggleBookingLink = async (id: number): Promise<boolean> => {
  const res = await fetch(`${BOOKINGS_URL}?action=toggle-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  return res.ok;
};

export const deleteBookingLink = async (id: number): Promise<boolean> => {
  const res = await fetch(`${BOOKINGS_URL}?action=link&id=${id}`, { method: 'DELETE' });
  return res.ok;
};

export const bookingPageUrl = (token: string) =>
  `${window.location.origin}/booking/${token}`;
/**
 * Держит ли заявка место в расписании.
 * Новая — да, ждёт обработки. Подтверждённая — только пока её занятие не прошло:
 * после этого ребёнок уже должен быть в CRM. Если его там нет (бросил, болеет,
 * не завели) — CRM источник правды, бронь места не занимает.
 */
export const bookingHoldsSlot = (b: Pick<Booking, 'status' | 'date'>, today = new Date()): boolean => {
  if (b.status === 'new') return true;
  if (b.status !== 'confirmed') return false;
  const t = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return (b.date || '') >= t;
};
