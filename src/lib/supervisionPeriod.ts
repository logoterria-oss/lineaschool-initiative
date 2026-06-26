export const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

export const QUARTERS = [
  { id: 1, label: 'I квартал (янв – мар)', from: 0, to: 2 },
  { id: 2, label: 'II квартал (апр – июн)', from: 3, to: 5 },
  { id: 3, label: 'III квартал (июл – сен)', from: 6, to: 8 },
  { id: 4, label: 'IV квартал (окт – дек)', from: 9, to: 11 },
];

export const monthStart = (year: number, month: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}-01`;

export const monthEnd = (year: number, month: number) => {
  const last = new Date(year, month + 1, 0).getDate();
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
};

export type PeriodMode = 'quarter' | 'range';
