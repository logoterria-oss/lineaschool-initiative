export type SubItemKind = 'component' | 'stub';

export interface AdminItem {
  id: string;
  label: string;
  kind: SubItemKind;
  icon: string;
}

export const ADMIN_MENU: AdminItem[] = [
  { id: 'schedule', label: 'Расписание групп и свободные слоты', kind: 'component', icon: 'CalendarDays' },
  { id: 'payments-status', label: 'Статус оплат', kind: 'component', icon: 'CreditCard' },
  { id: 'interactions', label: 'Взаимодействия', kind: 'component', icon: 'MessagesSquare' },
  { id: 'vacations', label: 'Даты каникул', kind: 'component', icon: 'CalendarOff' },
  { id: 'progress', label: 'Мониторинг прогресса', kind: 'component', icon: 'TrendingUp' },
  { id: 'violations', label: 'Дисциплинарные нарушения педагогов', kind: 'component', icon: 'TriangleAlert' },
  { id: 'students-list', label: 'Список учеников', kind: 'component', icon: 'GraduationCap' },
  { id: 'leads-list', label: 'Список лидов', kind: 'component', icon: 'UserPlus' },
  { id: 'staff-list', label: 'Список сотрудников', kind: 'component', icon: 'Users' },
  { id: 'regulations', label: 'Регламент работы администратора', kind: 'stub', icon: 'ScrollText' },
];
