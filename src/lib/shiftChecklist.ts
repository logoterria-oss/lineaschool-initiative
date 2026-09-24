export type ChecklistBlock = 'morning' | 'day' | 'evening' | 'weekly';

export interface ChecklistItem {
  key: string;
  num: number;
  title: string;
  place: string;
  block: ChecklistBlock;
  /**
   * Пункт проверяется по CRM — рисуем его отдельной карточкой с подпунктами.
   * 'yesterday' — вчерашний день, 'schedule' — расписание на сегодня,
   * 'balance' — остаток занятий на абонементах и ПДУ.
   */
  auto?: 'yesterday' | 'schedule' | 'balance';
}

/** Ключи проверок по CRM — как их отдаёт бэкенд */
export type ScheduleCheckKey = 'm1a' | 'm2a' | 'm2b' | 'm2c' | 'm3a' | 'm3b' | 'm3c';

export interface ScheduleCheckMeta {
  key: ScheduleCheckKey;
  letter: string;
  title: string;
  /** Что пишем, когда CRM ничего не нашла */
  empty: string;
  /** К какому пункту чек-листа относится подпункт */
  group: 'yesterday' | 'schedule' | 'balance';
  /** Что делаем с находкой — подсказка администратору */
  action?: string;
  /** Рядом с находкой показываем ссылку на оплату из CRM */
  payLink?: boolean;
}

/**
 * Подпункты проверок по AlfaCRM. Каждый — отдельный поиск:
 * пусто → «нет» и зелёная галка, есть находки → список с галочками.
 */
export const SCHEDULE_CHECKS: ScheduleCheckMeta[] = [
  {
    key: 'm1a',
    letter: 'а',
    title: 'Все уроки проведены (нет статуса «проведено»)',
    empty: 'Да — все вчерашние уроки проведены',
    group: 'yesterday',
  },
  {
    key: 'm2a',
    letter: 'а',
    title: 'Неоплаченные занятия сегодня',
    empty: 'Нет — все сегодняшние занятия оплачены',
    group: 'schedule',
  },
  {
    key: 'm2b',
    letter: 'б',
    title: 'Наслоения в расписании: два урока у педагога в одно время',
    empty: 'Нет — наслоений у педагогов не найдено',
    group: 'schedule',
  },
  {
    key: 'm2c',
    letter: 'в',
    title: 'Группы, где осталось меньше 3 учеников (без отменивших)',
    empty: 'Нет — во всех группах 3 и больше учеников',
    group: 'schedule',
  },
  {
    key: 'm3a',
    letter: 'а',
    title: 'Остался 1 оплаченный урок — предупредить и отправить ссылку на оплату',
    empty: 'Нет — ни у кого не остался последний оплаченный урок',
    group: 'balance',
    action: 'Написать родителю и отправить ссылку на оплату',
    payLink: true,
  },
  {
    key: 'm3b',
    letter: 'б',
    title: 'Занятия на абонементе закончились, урок завтра-послезавтра — напомнить',
    empty: 'Нет — у всех с ближайшими уроками есть оплаченные занятия',
    group: 'balance',
    action: 'Напомнить об оплате и отправить ссылку',
    payLink: true,
  },
  {
    key: 'm3c',
    letter: 'в',
    title: 'Запланировать ПДУ — активные ученики со статусом «пора»',
    empty: 'Нет — всем активным ученикам ПДУ пока не нужна',
    group: 'balance',
    action: 'Согласовать дату и поставить диагностику в расписание',
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
    title: 'Вчерашний день',
    place: 'AlfaCRM',
    block: 'morning',
    auto: 'yesterday',
  },
  {
    key: 'm2',
    num: 2,
    title: 'Расписание на сегодня',
    place: 'AlfaCRM',
    block: 'morning',
    auto: 'schedule',
  },
  {
    key: 'm3',
    num: 3,
    title: 'Остаток занятий',
    place: 'AlfaCRM → раздел 7',
    block: 'morning',
    auto: 'balance',
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