export type ChecklistBlock = 'morning' | 'day' | 'evening' | 'weekly';

export interface ChecklistItem {
  key: string;
  num: number;
  title: string;
  place: string;
  block: ChecklistBlock;
  /** Пункт проверяется автоматически по CRM — рисуем его отдельной карточкой */
  auto?: 'schedule';
}

/** Ключи автопроверок расписания (пункт 1) — как их отдаёт бэкенд */
export type ScheduleCheckKey = 'm1a' | 'm1b' | 'm1c' | 'm1d';

export interface ScheduleCheckMeta {
  key: ScheduleCheckKey;
  letter: string;
  title: string;
  /** Что пишем, когда CRM ничего не нашла */
  empty: string;
}

/**
 * Подразделы пункта 1. Каждый — отдельный поиск по AlfaCRM:
 * пусто → «нет» и зелёная галка, есть находки → список с галочками.
 */
export const SCHEDULE_CHECKS: ScheduleCheckMeta[] = [
  {
    key: 'm1a',
    letter: 'а',
    title: 'Не проведённые уроки за вчера (нет статуса «проведено»)',
    empty: 'Нет — все вчерашние уроки проведены',
  },
  {
    key: 'm1b',
    letter: 'б',
    title: 'Неоплаченные занятия сегодня',
    empty: 'Нет — все сегодняшние занятия оплачены',
  },
  {
    key: 'm1c',
    letter: 'в',
    title: 'Наслоения в расписании: два урока у педагога в одно время',
    empty: 'Нет — наслоений у педагогов не найдено',
  },
  {
    key: 'm1d',
    letter: 'г',
    title: 'Группы, где осталось меньше 3 учеников (без отменивших)',
    empty: 'Нет — во всех группах 3 и больше учеников',
  },
];

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
    title: 'Проверить расписание: непроведённые уроки, оплаты, наслоения, наполняемость групп',
    place: 'AlfaCRM — проверки идут автоматически',
    block: 'morning',
    auto: 'schedule',
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