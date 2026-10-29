import {
  Lead, NO_CONTACT_FINAL, NO_CONTACT_STATUS, NO_REPLY_PROCESSING, STUCK_CHECKED, STUCK_REMINDED, STUCK_STATUS, WINDOW_STAGE,
  hasStuckFlow,
} from '@/lib/leadsApi';

export const SHIFT_END_HOUR = 18;
const HOUR = 3600_000;

export type GroupKey = 'new' | 'diag' | 'lessons' | 'contact' | 'stuck';

export interface DashLead {
  lead: Lead;
  hint: string;
  due?: Date;
}

export interface LeadGroup {
  key: GroupKey;
  title: string;
  icon: string;
  items: DashLead[];
}

const parse = (v?: string | null): Date | null => {
  if (!v) return null;
  const d = new Date(v.includes('T') || v.length <= 10 ? v : v.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
};

const dayDiff = (iso: string, today: string): number => {
  const a = Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${today}T00:00:00Z`);
  return Math.round((a - b) / 86400_000);
};

const dayWord = (diff: number) => (diff === 0 ? 'сегодня' : diff === 1 ? 'завтра' : diff === 2 ? 'послезавтра' : '');

/** Если срок выпал на конец смены (после 18:00) — переносим на начало следующего дня */
const withinShift = (d: Date): Date => {
  if (d.getHours() < SHIFT_END_HOUR) return d;
  const next = new Date(d);
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return next;
};

/** Следующий шаг дозвона по этапам связи */
export function nextContactStep(l: Lead, now = new Date()): { action: string; due: Date } {
  const dates = l.no_contact_stage_dates || {};
  const stage = l.no_contact_stage || '';
  const at = (s: string) => parse(s === WINDOW_STAGE ? l.window_first_at || dates[s] : dates[s]);

  if (stage === 'звонок 2') {
    const t = at('звонок 2');
    return { action: 'Звонок 3 (если не ответят — «лид не вышел на связь»)', due: t ? new Date(t.getTime() + 24 * HOUR) : now };
  }
  if (stage === 'звонок 1') {
    const t = at('звонок 1');
    return { action: 'Звонок 2', due: t ? withinShift(new Date(t.getTime() + 6 * HOUR)) : now };
  }
  if (stage === 'отправлено СМС') {
    const t = at('отправлено СМС');
    return { action: 'Звонок 1', due: t ? withinShift(new Date(t.getTime() + 2 * HOUR)) : now };
  }
  const windowAt = (l.processing_status || '').trim() === NO_REPLY_PROCESSING ? at(WINDOW_STAGE) : null;
  return { action: 'Отправить СМС', due: windowAt ? new Date(windowAt.getTime() + 24 * HOUR) : now };
}

export function buildLeadGroups(leads: Lead[], today: string, now = new Date()): LeadGroup[] {
  const used = new Set<number>();
  const take = (l: Lead) => (used.has(l.id) ? false : (used.add(l.id), true));
  const active = leads.filter((l) => !l.archived);
  const ps = (l: Lead) => (l.processing_status || '').trim();
  const ls = (l: Lead) => (l.lead_status || '').trim();

  const diag: DashLead[] = [];
  const lessons: DashLead[] = [];
  for (const l of active) {
    if (ps(l) === 'Запланирована диагностика (не оплачено)' && l.crm_diag_planned_at) {
      const diff = dayDiff(l.crm_diag_planned_at, today);
      if (diff >= 0 && diff <= 1 && take(l)) {
        diag.push({ lead: l, hint: `Диагностика ${dayWord(diff)} в ${l.crm_diag_planned_at.slice(11, 16)} — не оплачена` });
      }
    }
  }
  for (const l of active) {
    if (ps(l) === 'Утверждено расписание' && l.next_lesson_at) {
      const diff = dayDiff(l.next_lesson_at, today);
      if (diff >= 0 && diff <= 2 && take(l)) {
        lessons.push({ lead: l, hint: `Первое занятие ${dayWord(diff)} в ${l.next_lesson_at.slice(11, 16)} — абонемент не оплачен` });
      }
    }
  }

  const contact: DashLead[] = active
    .filter((l) => ls(l) === NO_CONTACT_STATUS && (l.no_contact_stage || '') !== NO_CONTACT_FINAL && take(l))
    .map((l) => {
      const s = nextContactStep(l, now);
      return { lead: l, hint: s.action, due: s.due };
    })
    .filter((i) => {
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);
      return i.due!.getTime() <= endOfToday.getTime();
    })
    .sort((a, b) => a.due!.getTime() - b.due!.getTime());

  const fresh: DashLead[] = active
    .filter((l) => ps(l) === '' && ls(l) === '' && take(l))
    .map((l) => ({ lead: l, hint: 'Новый лид — не разобран' }));

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const stuck: DashLead[] = active
    .filter((l) => ls(l) === STUCK_STATUS)
    .map((l): DashLead => {
      const base = `Завис на этапе «${ps(l) || 'не разобрано'}»`;
      if (!hasStuckFlow(l)) return { lead: l, hint: base };
      const st = l.stuck_stage || '';
      if (st === STUCK_REMINDED) {
        const t = parse(l.stuck_stage_dates?.[STUCK_REMINDED]);
        return { lead: l, hint: `${base} · уточнить актуальность диагностики`, due: t ? new Date(t.getTime() + 24 * HOUR) : now };
      }
      if (st === STUCK_CHECKED) return { lead: l, hint: '' };
      return { lead: l, hint: `${base} · напомнить о себе` };
    })
    .filter((i) => i.hint && (!i.due || i.due.getTime() <= endOfToday.getTime()) && take(i.lead));

  return [
    { key: 'new', title: 'Новые лиды', icon: 'Sparkles', items: fresh },
    { key: 'diag', title: 'Диагностика завтра — не оплачена', icon: 'Stethoscope', items: diag },
    { key: 'lessons', title: 'Занятия через 2 дня и меньше — не оплачены', icon: 'GraduationCap', items: lessons },
    { key: 'contact', title: 'Связь через «Окно» не налажена', icon: 'PhoneForwarded', items: contact },
    { key: 'stuck', title: 'Зависшие лиды', icon: 'Hourglass', items: stuck },
  ];
}