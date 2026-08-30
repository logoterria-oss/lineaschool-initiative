export type SubItemKind = 'component' | 'stub';

export interface AdminItem {
  id: string;
  label: string;
  kind: SubItemKind;
  icon: string;
  /** id родительской группы, если пункт вложенный */
  group?: string;
}

export interface AdminGroup {
  id: string;
  label: string;
  icon: string;
  items: AdminItem[];
}

/** Плоские разделы верхнего уровня (без подразделов) */
export const ADMIN_MENU: AdminItem[] = [
  { id: 'admin-shifts', label: 'График работы админов', kind: 'component', icon: 'CalendarClock' },
  { id: 'schedule', label: 'Расписание групп и свободные слоты', kind: 'component', icon: 'CalendarDays' },
  { id: 'payments-status', label: 'Статус оплат', kind: 'component', icon: 'CreditCard' },
  { id: 'pay-links', label: 'Ссылки на оплату', kind: 'component', icon: 'Link' },
  { id: 'interactions', label: 'Взаимодействия', kind: 'component', icon: 'MessagesSquare' },
  { id: 'vacations', label: 'Даты каникул', kind: 'component', icon: 'CalendarOff' },
  { id: 'progress', label: 'Мониторинг прогресса', kind: 'component', icon: 'TrendingUp' },
  { id: 'work-log', label: 'Журнал административного учёта', kind: 'component', icon: 'ClipboardPen' },
  { id: 'violations', label: 'Дисциплинарные нарушения педагогов', kind: 'component', icon: 'TriangleAlert' },
  { id: 'regulations', label: 'Регламент работы администратора', kind: 'stub', icon: 'ScrollText' },
];

/** Группы с подразделами */
export const ADMIN_GROUPS: AdminGroup[] = [
  {
    id: 'lists',
    label: 'Пофамильные списки',
    icon: 'ClipboardList',
    items: [
      { id: 'students-list', label: 'Список учеников', kind: 'component', icon: 'GraduationCap', group: 'lists' },
      { id: 'leads-list', label: 'Список лидов', kind: 'component', icon: 'UserPlus', group: 'lists' },
      { id: 'staff-list', label: 'Список сотрудников', kind: 'component', icon: 'Users', group: 'lists' },
    ],
  },
];