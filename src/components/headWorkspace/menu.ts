export type SubItemKind = 'component' | 'link' | 'stub';

export interface SubItem {
  id: string;
  label: string;
  kind: SubItemKind;
  icon: string;
  /** для kind='link' — путь существующей страницы */
  path?: string;
}

export interface MenuGroup {
  id: string;
  label: string;
  icon: string;
  items: SubItem[];
}

export const HEAD_MENU: MenuGroup[] = [
  {
    id: 'lessons',
    label: 'Уроки и диагностики',
    icon: 'BookOpen',
    items: [
      { id: 'reports', label: 'Анкеты и заключения', kind: 'component', icon: 'FileText' },
      { id: 'schedule', label: 'Расписание групп и свободные слоты', kind: 'component', icon: 'CalendarDays' },
      { id: 'homework', label: 'Контроль ДЗ', kind: 'component', icon: 'ClipboardCheck' },
      { id: 'students-list', label: 'Список учеников', kind: 'component', icon: 'GraduationCap' },
    ],
  },
  {
    id: 'staff',
    label: 'Сотрудники',
    icon: 'Users',
    items: [
      { id: 'staff-list', label: 'Список сотрудников', kind: 'component', icon: 'Contact' },
      { id: 'rate', label: 'Ставка', kind: 'stub', icon: 'Wallet' },
      { id: 'worktime', label: 'Рабочее время', kind: 'component', icon: 'Clock' },
      { id: 'supervisions', label: 'Супервизии', kind: 'component', icon: 'UserCheck' },
      { id: 'violations', label: 'Дисциплинарные нарушения', kind: 'component', icon: 'TriangleAlert' },
      { id: 'regulations', label: 'Регламенты', kind: 'component', icon: 'ScrollText' },
    ],
  },
  {
    id: 'administration',
    label: 'Администрирование',
    icon: 'Settings',
    items: [
      { id: 'interactions', label: 'Взаимодействия', kind: 'component', icon: 'MessagesSquare' },
      { id: 'vacations', label: 'Даты каникул', kind: 'component', icon: 'CalendarOff' },
      { id: 'progress', label: 'Мониторинг прогресса', kind: 'component', icon: 'TrendingUp' },
    ],
  },
  {
    id: 'finance',
    label: 'Финансы',
    icon: 'Coins',
    items: [
      { id: 'payments', label: 'Оплаты', kind: 'component', icon: 'CreditCard' },
      { id: 'reports-fin', label: 'Отчёты', kind: 'component', icon: 'BarChart2' },
      { id: 'calendar', label: 'Календарь регулярных платежей', kind: 'component', icon: 'CalendarClock' },
    ],
  },
  {
    id: 'site',
    label: 'Сайт',
    icon: 'Globe',
    items: [
      { id: 'users', label: 'Пользователи', kind: 'component', icon: 'Users' },
    ],
  },
];