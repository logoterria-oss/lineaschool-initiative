import func2url from '../../backend/func2url.json';
import { getStaffToken } from './staffApi';

export const DIAG_BOOKING_URL = (func2url as Record<string, string>)['diag-booking'];
const LEAD_PROCESSOR_URL = (func2url as Record<string, string>)['lead-processor'];

export type DiagBookingStatus = 'new' | 'confirmed' | 'rejected';

export interface DiagLink {
  id: number;
  token: string;
  title: string;
  childName: string;
  parentName: string;
  phone: string;
  isPublic: boolean;
  active: boolean;
  maxBookings: number;
  createdBy: string;
  createdAt: string;
  bookingsCount: number;
}

export interface DiagSlot {
  id: number;
  date: string;
  dateRu: string;
  weekdayName: string;
  timeFrom: string;
  timeTo: string;
  bookingId: number | null;
  childName?: string | null;
  parentName?: string | null;
}

export interface DiagBooking {
  id: number;
  slotId: number;
  date: string;
  dateRu: string;
  weekdayName: string;
  timeFrom: string;
  timeTo: string;
  childName: string;
  childBirthDate: string;
  parentName: string;
  phone: string;
  telegram: string;
  messengers: string;
  comment: string;
  status: DiagBookingStatus;
  statusLabel: string;
  processedBy: string;
  processedAt: string | null;
  createdAt: string;
}

export interface DiagCoverage {
  today: string;
  isSunday: boolean;
  /** В каждой из двух ближайших недель есть окна */
  enough: boolean;
  freeInTwoWeeks: number;
  lastSlotDate: string | null;
  lastSlotDateRu: string | null;
}

const json = async (res: Response) => {
  try {
    return await res.json();
  } catch {
    return {};
  }
};

const staffHeaders = (): Record<string, string> => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const t = getStaffToken();
  if (t) h['X-Auth-Token'] = t;
  return h;
};

const get = (action: string, extra = '') =>
  fetch(`${DIAG_BOOKING_URL}?action=${action}${extra}`, { headers: staffHeaders() }).then(json);

const post = (action: string, body: unknown) =>
  fetch(`${DIAG_BOOKING_URL}?action=${action}`, {
    method: 'POST',
    headers: staffHeaders(),
    body: JSON.stringify(body),
  }).then(json);

// ── Родитель ──────────────────────────────────────────────────────────────────

export const checkDiagLink = async (
  token: string,
): Promise<{ link?: DiagLink; limitReached?: boolean; error?: string; message?: string; network?: boolean }> => {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(`${DIAG_BOOKING_URL}?action=check&token=${encodeURIComponent(token)}`);
      const data = await json(res);
      if (data.link || data.error) return data;
    } catch {
      /* сеть — пробуем ещё раз */
    }
    await new Promise((r) => setTimeout(r, 700 * (i + 1)));
  }
  return { network: true };
};

export const fetchDiagFreeSlots = async (token: string): Promise<DiagSlot[]> => {
  const res = await fetch(`${DIAG_BOOKING_URL}?action=slots&token=${encodeURIComponent(token)}`);
  const data = await json(res);
  return data.slots || [];
};

export interface DiagBookInput {
  token: string;
  slotId: number;
  childName: string;
  childBirthDate: string;
  parentName: string;
  phone: string;
  telegram: string;
  messengers: string[];
  comment?: string;
  marketingConsent: boolean;
  utm?: unknown;
}

export const bookDiag = async (
  input: DiagBookInput,
): Promise<{ ok?: boolean; booking?: DiagBooking; error?: string; message?: string }> => {
  const res = await fetch(`${DIAG_BOOKING_URL}?action=book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return json(res);
};

/** Запись попадает в «Список лидов», CRM и «Окно» тем же путём, что заявки с сайта */
export const sendDiagLead = (input: DiagBookInput, booking: DiagBooking) =>
  fetch(LEAD_PROCESSOR_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      childName: input.childName,
      childBirthDate: input.childBirthDate,
      parentName: input.parentName,
      phone: input.phone,
      telegram: input.telegram,
      messengers: input.messengers,
      email: '',
      date: `${booking.dateRu} (${booking.weekdayName.toLowerCase()})`,
      time: `${booking.timeFrom}–${booking.timeTo} МСК`,
      marketingConsent: input.marketingConsent,
      utm: input.utm,
      note: 'Запись через страницу бронирования диагностики',
    }),
  }).catch(() => undefined);

// ── Сотрудники ────────────────────────────────────────────────────────────────

export const fetchDiagAdminSlots = async (): Promise<{ slots: DiagSlot[]; coverage: DiagCoverage | null }> => {
  const data = await get('admin-slots');
  return { slots: data.slots || [], coverage: data.coverage || null };
};

export const fetchDiagCoverage = async (): Promise<DiagCoverage | null> => {
  const data = await get('coverage');
  return data.today ? data : null;
};

export const addDiagSlots = async (
  dates: string[],
  times: { from: string; to: string }[],
): Promise<{ ok?: boolean; added?: number; error?: string }> => post('add-slots', { dates, times });

export const deleteDiagSlot = async (id: number): Promise<{ ok?: boolean; error?: string }> =>
  fetch(`${DIAG_BOOKING_URL}?action=delete-slot&id=${id}`, {
    method: 'DELETE',
    headers: staffHeaders(),
  }).then(json);

export const fetchDiagLinks = async (): Promise<DiagLink[]> => (await get('links')).links || [];

export const createDiagLink = async (childName: string): Promise<DiagLink | null> =>
  (await post('create-link', { childName })).link || null;

export const fetchDiagPublicLink = async (): Promise<DiagLink | null> =>
  (await post('public-link', {})).link || null;

export const toggleDiagLink = (id: number) => post('toggle-link', { id });

export const fetchDiagBookings = async (
  status: DiagBookingStatus | 'all' = 'all',
): Promise<{ bookings: DiagBooking[]; newCount: number }> => {
  const data = await get('bookings', `&status=${status}`);
  return { bookings: data.bookings || [], newCount: data.newCount || 0 };
};

export const setDiagBookingStatus = async (
  id: number,
  status: DiagBookingStatus,
): Promise<DiagBooking | null> => (await post('set-status', { id, status })).booking || null;

export const diagBookingPageUrl = (token: string) => `${window.location.origin}/diag-booking/${token}`;

/** Событие: руководитель изменил окна — напоминание пересчитывается сразу */
export const DIAG_SLOTS_EVENT = 'diag-slots-changed';
export const notifyDiagSlotsChanged = () => window.dispatchEvent(new Event(DIAG_SLOTS_EVENT));
