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
  { id: 'subscription-check', label: 'Корректность абонементов в CRM', kind: 'component', icon: 'BadgeCheck' },
  { id: 'interactions', label: 'Взаимодействия', kind: 'component', icon: 'MessagesSquare' },
  { id: 'vacations', label: 'Даты каникул', kind: 'component', icon: 'CalendarOff' },
  { id: 'progress', label: 'Мониторинг прогресса', kind: 'component', icon: 'TrendingUp' },
  { id: 'dropouts', label: 'Бросившие', kind: 'component', icon: 'UserMinus' },
  { id: 'reviews-improve', label: 'Что улучшить — отзывы', kind: 'component', icon: 'MessageSquareHeart' },
  { id: 'reviews-lesson', label: 'Бесплатный урок за отзыв', kind: 'component', icon: 'Gift' },
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
/**
 * Разделы, открытые отдельным администраторам сверх общего меню.
 * Ключ — id сотрудника в таблице staff.
 */
const PERSONAL_ITEMS: Record<number, AdminItem[]> = {
  // Хорунжева Анна
  14: [
    { id: 'questionnaires', label: 'Анкеты родителей', kind: 'component', icon: 'ClipboardList' },
    { id: 'leads-list', label: 'Список лидов', kind: 'component', icon: 'UserPlus' },
  ],
};

/** Группы конкретного администратора: без пунктов, вынесенных в его личное меню */
export const adminGroupsFor = (staffId?: number | null): AdminGroup[] => {
  const extra = (staffId && PERSONAL_ITEMS[staffId]) || [];
  if (!extra.length) return ADMIN_GROUPS;
  const moved = new Set(extra.map((i) => i.id));
  return ADMIN_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => !moved.has(i.id)) })).filter(
    (g) => g.items.length > 0,
  );
};

/** Меню конкретного администратора: общее + личные разделы после расписания */
export const adminMenuFor = (staffId?: number | null): AdminItem[] => {
  const extra = (staffId && PERSONAL_ITEMS[staffId]) || [];
  if (!extra.length) return ADMIN_MENU;
  const at = ADMIN_MENU.findIndex((i) => i.id === 'schedule') + 1;
  return [...ADMIN_MENU.slice(0, at), ...extra, ...ADMIN_MENU.slice(at)];
};