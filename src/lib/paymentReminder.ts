import { INTERACTION_URL } from '@/lib/interactionUrl';

const WEEKDAYS_ACC = [
  'воскресенье',
  'понедельник',
  'вторник',
  'среду',
  'четверг',
  'пятницу',
  'субботу',
];

const parseDay = (d: string) => {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, (m || 1) - 1, day || 1);
};

const ddmm = (dt: Date) =>
  `${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}`;

/**
 * Текст напоминания родителю об оплате.
 * m3a — остался последний оплаченный урок; m3b — занятия закончились, урок скоро.
 */
export const reminderText = (kind: 'm3a' | 'm3b', payUrl: string, lessonDate?: string): string => {
  const link = payUrl || '[ссылка на оплату]';
  if (kind === 'm3a') {
    return (
      'Здравствуйте! На вашем абонементе осталось одно оплаченное занятие. Продолжаем?\n' +
      `Оплатить абонемент можно по ссылке: ${link}`
    );
  }
  let when = '';
  let deadline = '';
  if (lessonDate) {
    const dt = parseDay(lessonDate);
    const before = new Date(dt);
    before.setDate(dt.getDate() - 1);
    when = ` в ${WEEKDAYS_ACC[dt.getDay()]} (${ddmm(dt)})`;
    deadline = ` до ${ddmm(before)} до 20:00 по Мск`;
  }
  return (
    'Здравствуйте! На вашем абонементе закончились оплаченные занятия. ' +
    `Чтобы следующее занятие состоялось по расписанию${when}, ` +
    `необходимо оплатить абонемент${deadline}.\n\n` +
    `Ссылка на оплату: ${link}`
  );
};

/** Адрес «Окна взаимодействия» с готовым сообщением для клиента из CRM */
export const interactionMessageUrl = (p: {
  crmCustomerId: number;
  text: string;
  reminderId: number | null;
}): string => {
  const q = new URLSearchParams({
    crm_customer_id: String(p.crmCustomerId),
    text: p.text,
  });
  if (p.reminderId) q.set('reminder_id', String(p.reminderId));
  return `${INTERACTION_URL}?${q.toString()}`;
};
