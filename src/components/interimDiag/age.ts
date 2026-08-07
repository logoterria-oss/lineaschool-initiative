/**
 * Возраст ребёнка в годах.
 *
 * Дата рождения приходит из разных источников в разном формате:
 * «2017-08-14» из базы и «14.08.2017» из ручного ввода — понимаем оба.
 *
 * onDate — день, на который считаем возраст. В заключении это дата
 * диагностики, а не сегодняшний день: заключение могут открыть через год,
 * и возраст в нём должен остаться тем, что был на момент обследования.
 */
export function calculateAge(birthDate: string, onDate?: string): string {
  if (!birthDate) return '';

  const parts = birthDate.split(/[-./]/);
  if (parts.length !== 3) return '';

  let [year, month, day] = parts;
  if (year.length !== 4) {
    [day, month, year] = parts;
  }

  const birth = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  if (isNaN(birth.getTime())) return '';

  const target = onDate ? new Date(onDate) : new Date();
  if (isNaN(target.getTime())) return '';

  let age = target.getFullYear() - birth.getFullYear();
  const monthDiff = target.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && target.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age.toString() : '';
}

/** «9 лет», «21 год», «22 года» — падеж по правилам русского языка */
export function ageWithUnit(age: string | number): string {
  const n = Number(age);
  if (!Number.isFinite(n) || n < 0) return '';

  const last = n % 10;
  const lastTwo = n % 100;

  if (lastTwo >= 11 && lastTwo <= 14) return `${n} лет`;
  if (last === 1) return `${n} год`;
  if (last >= 2 && last <= 4) return `${n} года`;
  return `${n} лет`;
}
