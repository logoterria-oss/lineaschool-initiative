import { INTERACTION_URL } from '@/lib/interactionUrl';

/**
 * Текст напоминания родителю об оплате.
 * m3a — остался последний оплаченный урок; m3b — занятия закончились, урок скоро.
 */
export const reminderText = (kind: 'm3a' | 'm3b', payUrl: string): string => {
  const link = payUrl || '[ссылка на оплату]';
  if (kind === 'm3a') {
    return (
      'Здравствуйте! На вашем абонементе осталось одно оплаченное занятие. Продолжаем?\n' +
      `Оплатить абонемент можно по ссылке: ${link}`
    );
  }
  return (
    'Здравствуйте! На вашем абонементе закончились оплаченные занятия. ' +
    'Подскажите, получится оплатить сегодня до 20:00 по Мск?\n' +
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
