export type ChecklistBlock = 'morning' | 'day' | 'evening' | 'weekly';

export interface ChecklistItem {
  key: string;
  num: number;
  title: string;
  place: string;
  block: ChecklistBlock;
}

export const BLOCK_TITLES: Record<ChecklistBlock, string> = {
  morning: 'Утро — до 10:00 по Москве',
  day: 'В течение дня',
  evening: 'Вечер — завершение дня',
  weekly: 'Еженедельно — по понедельникам',
};

/**
 * Постоянный чек-лист администратора на день.
 * Пункт «доп. задания руководителя» сюда не входит — вместо него
 * подставляются задачи, назначенные руководителем в календаре смен.
 */
export const CHECKLIST: ChecklistItem[] = [
  {
    key: 'm1',
    num: 1,
    title: 'Проверить расписание на сегодня: нет ли наслоений, конфликтов, неоплаченных занятий',
    place: 'AlfaCRM',
    block: 'morning',
  },
  {
    key: 'm2',
    num: 2,
    title: 'Проверить уроки за вчера: все ли проведены, корректно ли списаны (особенно группы)',
    place: 'AlfaCRM',
    block: 'morning',
  },
  {
    key: 'm3',
    num: 3,
    title: 'Проверить активных учеников с 1 или 0 занятий на абонементе → отправить напоминание',
    place: 'AlfaCRM → раздел 7',
    block: 'morning',
  },
  {
    key: 'm4',
    num: 4,
    title: 'Проверить входящие сообщения за ночь → ответить',
    place: 'Мессенджер, Окно',
    block: 'morning',
  },
  {
    key: 'd5',
    num: 5,
    title: 'Отвечать на звонки — сразу, на сообщения — не дольше 15 минут',
    place: 'Окно / мессенджер',
    block: 'day',
  },
  {
    key: 'd6',
    num: 6,
    title: 'Обрабатывать запросы на переносы, отмены, замены → вносить в CRM и админку',
    place: 'AlfaCRM + админка → раздел 6.2',
    block: 'day',
  },
  {
    key: 'd7',
    num: 7,
    title: 'При поступлении платежа — провести оплату в CRM',
    place: 'AlfaCRM → раздел 2.3',
    block: 'day',
  },
  {
    key: 'd8',
    num: 8,
    title: 'Дублировать напоминание об оплате: за день до неоплаченного урока',
    place: 'Мессенджер → раздел 7',
    block: 'day',
  },
  {
    key: 'd9',
    num: 9,
    title: 'Отслеживать нарушения педагогов: ссылки, проведение уроков → фиксировать в админке',
    place: 'Админка → раздел 2.2',
    block: 'day',
  },
  {
    key: 'e11',
    num: 11,
    title: 'Сформировать отчёт для руководителя: переносы, отмены, списания, замены, проблемы',
    place: 'Отправить Ирине Зинченко → раздел 2.3',
    block: 'evening',
  },
  {
    key: 'e12',
    num: 12,
    title: 'Внести все изменения в журнал административного учёта: дата, ученик, код, суть',
    place: 'Админка → раздел 6.2.6',
    block: 'evening',
  },
  {
    key: 'e13',
    num: 13,
    title: 'Проверить наполняемость групп на завтра: больше 6 — перенести, меньше 3 — отменить',
    place: 'Админка / CRM → раздел 2.3',
    block: 'evening',
  },
  {
    key: 'w14',
    num: 14,
    title: 'Сверить расписание в CRM и админке — данные должны совпадать',
    place: 'CRM + админка',
    block: 'weekly',
  },
  {
    key: 'w15',
    num: 15,
    title: 'Проверить свободные слоты (группы и индивидуальные) → при дефиците сообщить руководству',
    place: 'Админка',
    block: 'weekly',
  },
];

/** Еженедельные пункты показываем только по понедельникам */
export function isMonday(date: string): boolean {
  return new Date(`${date}T00:00:00`).getDay() === 1;
}

/** Пункты чек-листа на конкретную дату */
export function checklistFor(date: string): ChecklistItem[] {
  return isMonday(date) ? CHECKLIST : CHECKLIST.filter((i) => i.block !== 'weekly');
}
