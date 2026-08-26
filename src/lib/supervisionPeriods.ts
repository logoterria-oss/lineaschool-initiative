import { monthStart, monthEnd } from './supervisionPeriod';

export interface ReportPeriod {
  key: string;
  label: string;
  year: number;
  fromMonth: number;
  toMonth: number;
  from: string;
  to: string;
}

// Год, в котором ставку считали не по календарным кварталам:
// июль–август отдельным периодом, а сентябрь ушёл в IV квартал (сен–дек)
export const SPECIAL_YEAR = 2026;

const build = (year: number, fromMonth: number, toMonth: number, label: string): ReportPeriod => ({
  key: `${year}-${fromMonth}-${toMonth}`,
  label: `${label} ${year}`,
  year,
  fromMonth,
  toMonth,
  from: monthStart(year, fromMonth),
  to: monthEnd(year, toMonth),
});

/** Отчётные периоды года: обычно кварталы, в особом году — свои периоды. */
export function periodsForYear(year: number): ReportPeriod[] {
  if (year === SPECIAL_YEAR) {
    return [
      build(year, 0, 2, 'I квартал (янв–мар)'),
      build(year, 3, 5, 'II квартал (апр–июн)'),
      build(year, 6, 7, 'Июль–август'),
      build(year, 8, 11, 'Сентябрь–декабрь'),
    ];
  }
  return [
    build(year, 0, 2, 'I квартал (янв–мар)'),
    build(year, 3, 5, 'II квартал (апр–июн)'),
    build(year, 6, 8, 'III квартал (июл–сен)'),
    build(year, 9, 11, 'IV квартал (окт–дек)'),
  ];
}

/** Все периоды за несколько лет подряд, по возрастанию даты. */
export function periodsRange(fromYear: number, toYear: number): ReportPeriod[] {
  const out: ReportPeriod[] = [];
  for (let y = fromYear; y <= toYear; y++) out.push(...periodsForYear(y));
  return out;
}

/** Период, в который попадает дата (по умолчанию — сегодня). */
export function currentPeriod(d: Date = new Date()): ReportPeriod {
  const list = periodsForYear(d.getFullYear());
  const m = d.getMonth();
  return list.find((p) => m >= p.fromMonth && m <= p.toMonth) ?? list[list.length - 1];
}

/** Период, следующий за указанным (может быть из следующего года). */
export function nextPeriod(p: ReportPeriod): ReportPeriod {
  const list = periodsForYear(p.year);
  const idx = list.findIndex((x) => x.key === p.key);
  if (idx >= 0 && idx < list.length - 1) return list[idx + 1];
  return periodsForYear(p.year + 1)[0];
}

/** Период, предшествующий указанному (может быть из прошлого года). */
export function previousPeriod(p: ReportPeriod): ReportPeriod {
  const list = periodsForYear(p.year);
  const idx = list.findIndex((x) => x.key === p.key);
  if (idx > 0) return list[idx - 1];
  const prev = periodsForYear(p.year - 1);
  return prev[prev.length - 1];
}