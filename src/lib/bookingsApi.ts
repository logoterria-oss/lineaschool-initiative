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
  lessonType: LessonType;
  startFrom: string | null;
  status: BookingStatus;
  statusLabel: string;
  adminNote: string;
  dialogId: number | null;
  createdAt: string | null;
  processedAt: string | null;
  processedBy: string;
}

export type LessonType = 'individual' | 'groups';

/** Педагог, свободный в это время */
export interface SlotTeacher {
  teacherId: number;
  teacherName: string;
  availableFrom?: string | null;
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
  limitReached?: boolean;
  error?: string;
  message?: string;
}> => {
  // Просим только выбранный тип занятий: запрашивать оба сразу долго
  const res = await fetch(
    `${BOOKINGS_URL}?action=slots&token=${encodeURIComponent(token)}` +
      `&start_from=${startFrom}&lesson_type=${lessonType}`,
  );
  const data = await json(res);
  return { individualDays: [], groupDays: [], ...data };
};

export const createBooking = async (input: {
  token: string;
  childName: string;
  parentName?: string;
  phone?: string;
  comment?: string;
  date: string;
  timeFrom: string;
  timeTo: string;
  teacherId: number;
  teacherName: string;
  lessonType?: LessonType;
  startFrom?: string;
}): Promise<{ ok?: boolean; booking?: Booking; error?: string; message?: string }> => {
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
): Promise<{ bookings: Booking[]; newCount: number }> => {
  const res = await fetch(`${BOOKINGS_URL}?action=bookings&status=${status}`);
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

export const deleteBooking = async (id: number): Promise<boolean> => {
  const res = await fetch(`${BOOKINGS_URL}?action=booking&id=${id}`, { method: 'DELETE' });
  return res.ok;
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