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
      { id: 'reports', label: 'Анкеты и заключения', kind: 'link', icon: 'FileText', path: '/admin/reports' },
      { id: 'schedule', label: 'Расписание групп и свободные слоты', kind: 'component', icon: 'CalendarDays' },
      { id: 'homework', label: 'Контроль ДЗ', kind: 'link', icon: 'ClipboardCheck', path: '/admin/teacher' },
      { id: 'students', label: 'Ученики', kind: 'component', icon: 'GraduationCap' },
    ],
  },
  {
    id: 'staff',
    label: 'Сотрудники',
    icon: 'Users',
    items: [
      { id: 'rate', label: 'Ставка', kind: 'stub', icon: 'Wallet' },
      { id: 'worktime', label: 'Рабочее время', kind: 'link', icon: 'Clock', path: '/admin/teacher' },
      { id: 'supervisions', label: 'Супервизии', kind: 'component', icon: 'UserCheck' },
      { id: 'violations', label: 'Дисциплинарные нарушения', kind: 'component', icon: 'TriangleAlert' },
      { id: 'regulations', label: 'Регламенты', kind: 'link', icon: 'ScrollText', path: '/admin/regulations' },
    ],
  },
  {
    id: 'finance',
    label: 'Финансы',
    icon: 'Coins',
    items: [
      { id: 'payments', label: 'Оплаты', kind: 'component', icon: 'CreditCard' },
      { id: 'reports-fin', label: 'Отчёты', kind: 'link', icon: 'BarChart2', path: '/admin/head-reports' },
      { id: 'calendar', label: 'Календарь регулярных платежей', kind: 'stub', icon: 'CalendarClock' },
    ],
  },
];
