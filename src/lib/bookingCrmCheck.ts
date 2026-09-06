// Сверка брони с расписанием CRM: перед подтверждением заявки проверяем,
// что ребёнка действительно завели в CRM на те же окна, которые выбрал родитель.

import { Booking } from '@/lib/bookingsApi';
import { namesSimilar } from '@/lib/nameSimilarity';
import { S20_URL, TEACHER_SHORT, RawLesson, Customer, fmtDate, addDays } from '@/components/schedule/types';

// У части педагогов номер в CRM не совпадает с номером в графике работы
const S20_TO_LOCAL: Record<number, number> = { 17: 20 };
const toLocalTeacher = (id: number) => S20_TO_LOCAL[id] ?? id;

const WEEKDAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

export interface CrmMismatch {
  lesson: string;
  reason: string;
}

export interface CrmCheckResult {
  ok: boolean;
  mismatches: CrmMismatch[];
  failed?: boolean;
}

const normTime = (raw?: string) => {
  const t = (raw || '').trim();
  return (t.includes(' ') ? t.split(' ').pop() || '' : t).slice(0, 5);
};

const weekdayOf = (iso: string) => new Date(`${iso}T00:00:00`).getDay();

const teacherLabel = (id: number) => TEACHER_SHORT[id] || `педагог #${id}`;

const slotLabel = (weekday: number, time: string, teacherId: number) =>
  `${WEEKDAYS[weekday]} в ${time} — ${teacherLabel(teacherId)}`;

/** Сверяем занятия заявки с расписанием CRM на ближайшие две недели. */
export const checkBookingAgainstCrm = async (booking: Booking): Promise<CrmCheckResult> => {
  const items = booking.lessons?.length ? booking.lessons : [booking];
  const start = new Date(`${(booking.startFrom || booking.date).slice(0, 10)}T00:00:00`);
  const df = fmtDate(start);
  const dt = fmtDate(addDays(start, 13));

  let lessons: RawLesson[] = [];
  let customers: Customer[] = [];
  try {
    const [lRes, cRes] = await Promise.all([
      fetch(`${S20_URL}?mode=lessons&date_from=${df}&date_to=${dt}`).then((r) => r.json()),
      fetch(`${S20_URL}?mode=customers`).then((r) => r.json()),
    ]);
    lessons = Array.isArray(lRes.lessons) ? lRes.lessons : [];
    customers = Array.isArray(cRes.customers) ? cRes.customers : [];
  } catch {
    return { ok: false, failed: true, mismatches: [] };
  }

  // Ищем ребёнка в базе CRM по имени
  const childIds = customers
    .filter((c) => c.name && namesSimilar(c.name, booking.childName))
    .map((c) => Number(c.id));

  if (!childIds.length) {
    return {
      ok: false,
      mismatches: [
        {
          lesson: booking.childName,
          reason: 'Ребёнка нет в CRM — карточка ещё не заведена',
        },
      ],
    };
  }

  // Все занятия CRM, где стоит этот ребёнок
  const own = lessons.filter((l) => {
    if (l.status !== 1 && l.status !== 3) return false;
    const ids = new Set<number>([
      ...(l.customer_ids || []),
      ...(l.details || []).map((d) => Number(d?.customer_id)).filter(Boolean),
    ]);
    return childIds.some((id) => ids.has(id));
  });

  const crmSlots = own.map((l) => ({
    weekday: weekdayOf((l.date || '').slice(0, 10)),
    time: normTime(l.time_from),
    teacherId: toLocalTeacher(Number((l.teacher_ids || [])[0] || 0)),
  }));

  const mismatches: CrmMismatch[] = [];
  for (const it of items) {
    const wd = weekdayOf(it.date);
    const time = (it.timeFrom || '').slice(0, 5);
    const teacherId = Number(it.teacherId);
    const label = slotLabel(wd, time, teacherId);

    const exact = crmSlots.some(
      (s) => s.weekday === wd && s.time === time && s.teacherId === teacherId,
    );
    if (exact) continue;

    const sameSlotOtherTeacher = crmSlots.find((s) => s.weekday === wd && s.time === time);
    if (sameSlotOtherTeacher) {
      mismatches.push({
        lesson: label,
        reason: `В CRM это занятие стоит у другого педагога — ${teacherLabel(sameSlotOtherTeacher.teacherId)}`,
      });
      continue;
    }

    if (crmSlots.length) {
      const where = crmSlots
        .map((s) => slotLabel(s.weekday, s.time, s.teacherId))
        .filter((v, i, a) => a.indexOf(v) === i)
        .join('; ');
      mismatches.push({ lesson: label, reason: `В CRM ребёнок стоит на другое время: ${where}` });
      continue;
    }

    mismatches.push({ lesson: label, reason: 'В расписании CRM этого занятия нет' });
  }

  return { ok: mismatches.length === 0, mismatches };
};
