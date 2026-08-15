/**
 * Каталог действий админа и руководителя.
 * Коды (Ппк, Опп, СП…) — те же, что в табличке учёта рабочего времени,
 * чтобы отчёты сходились с привычными обозначениями.
 */
export interface TaskType {
  code: string;
  title: string;
  /** Просим указать, по кому задача: ученик, педагог, клиент */
  subjectLabel?: string;
}

export interface TaskCategory {
  id: string;
  label: string;
  icon: string;
  items: TaskType[];
}

export const TASK_CATEGORIES: TaskCategory[] = [
  {
    id: 'schedule',
    label: 'Изменения в расписании',
    icon: 'CalendarDays',
    items: [
      { code: 'Ппк', title: 'Перенос по просьбе клиента', subjectLabel: 'Ученик' },
      { code: 'Опк', title: 'Отмена по просьбе клиента', subjectLabel: 'Ученик' },
      { code: 'Ппп', title: 'Перенос по просьбе педагога', subjectLabel: 'Педагог' },
      { code: 'Опп', title: 'Отмена по просьбе педагога', subjectLabel: 'Педагог' },
      { code: 'Птп', title: 'Перенос по техническим причинам', subjectLabel: 'Ученик' },
      { code: 'Отп', title: 'Отмена по техническим причинам', subjectLabel: 'Ученик' },
      { code: 'СП', title: 'Списание при неявке или отмене менее чем за 4 часа', subjectLabel: 'Ученик' },
      { code: 'ИР', title: 'Изменение расписания', subjectLabel: 'Ученик' },
      { code: 'ФК', title: 'Фиксация времени каникул (без заморозки)', subjectLabel: 'Ученик' },
      { code: 'ЗА', title: 'Фиксация времени каникул (абонемент заморожен)', subjectLabel: 'Ученик' },
    ],
  },
  {
    id: 'teachers',
    label: 'Работа с педагогами',
    icon: 'Users',
    items: [
      { code: 'ПЗ', title: 'Подбор замены на время больничного или отпуска', subjectLabel: 'Педагог' },
      { code: 'СУП', title: 'Супервизия', subjectLabel: 'Педагог' },
      { code: 'ДН', title: 'Фиксация дисциплинарного нарушения', subjectLabel: 'Педагог' },
      { code: 'ПМ', title: 'Подготовка материалов для групп' },
    ],
  },
  {
    id: 'clients',
    label: 'Работа с клиентами',
    icon: 'MessagesSquare',
    items: [
      { code: 'ОЛ', title: 'Обработка новой заявки или лида', subjectLabel: 'Клиент' },
      { code: 'ОК', title: 'Переписка или созвон с клиентом', subjectLabel: 'Клиент' },
      { code: 'ЗД', title: 'Запись на диагностику', subjectLabel: 'Ученик' },
      { code: 'ОС', title: 'Сбор обратной связи после урока', subjectLabel: 'Ученик' },
      { code: 'ВЗ', title: 'Работа с возражениями и возвратом клиента', subjectLabel: 'Клиент' },
    ],
  },
  {
    id: 'finance',
    label: 'Оплаты и абонементы',
    icon: 'CreditCard',
    items: [
      { code: 'ВС', title: 'Выставление счёта', subjectLabel: 'Ученик' },
      { code: 'ПО', title: 'Проверка и проведение оплаты', subjectLabel: 'Ученик' },
      { code: 'ПА', title: 'Продление абонемента', subjectLabel: 'Ученик' },
      { code: 'ЗД$', title: 'Работа с задолженностью', subjectLabel: 'Ученик' },
    ],
  },
  {
    id: 'admin',
    label: 'Ведение админки',
    icon: 'Settings',
    items: [
      { code: 'АНК', title: 'Занесение анкеты родителя', subjectLabel: 'Ученик' },
      { code: 'КДЗ', title: 'Контроль домашних заданий', subjectLabel: 'Ученик' },
      { code: 'СУ', title: 'Ведение списка учеников', subjectLabel: 'Ученик' },
      { code: 'ЛЗ', title: 'Оформление логопедического заключения', subjectLabel: 'Ученик' },
      { code: 'ОТЧ', title: 'Подготовка отчёта', subjectLabel: 'Тема' },
    ],
  },
  {
    id: 'other',
    label: 'Другое',
    icon: 'CircleEllipsis',
    items: [
      { code: 'ДИАГ', title: 'Диагностика', subjectLabel: 'Ученик' },
      { code: 'СОВ', title: 'Совещание или планёрка', subjectLabel: 'Тема' },
      { code: 'ПР', title: 'Прочая задача', subjectLabel: 'Тема' },
    ],
  },
];

export function findTask(code: string): { task: TaskType; category: TaskCategory } | null {
  for (const cat of TASK_CATEGORIES) {
    const task = cat.items.find((t) => t.code === code);
    if (task) return { task, category: cat };
  }
  return null;
}

/** Быстрые кнопки времени в форме */
export const MINUTE_PRESETS = [5, 10, 15, 20, 30, 45, 60, 90, 120];