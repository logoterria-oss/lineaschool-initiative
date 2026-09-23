/**
 * Маржинальность ОДНОГО УРОКА — юнит-экономика без абонементов.
 *
 * Почему не по абонементам. У детей одновременно живут действующие,
 * архивные и совсем доисторические абонементы с разными ценами и составом.
 * Средняя «по абонементу» получается ни о чём: сравнивать месяцы нечем.
 * Единственный юнит, который одинаково устроен в любом месяце, — ОДИН
 * ПРОВЕДЁННЫЙ УРОК. Его и считаем.
 *
 * ЮНИТ — ЗАНЯТИЕ ЦЕЛИКОМ, НЕ КЛИЕНТ.
 * Это принципиально. Школа продаёт не «место в группе», а ставит в
 * расписание урок: педагогу платят один раз за проведённое занятие,
 * независимо от того, пришло на него 3 ребёнка или 5.
 *   • ИНДИВИДУАЛЬНОЕ занятие: выручка — оплата одного ребёнка,
 *     расход — ставка педагога целиком.
 *   • ГРУППОВОЕ занятие: выручка — сумма оплат ВСЕХ детей группы
 *     (средняя цена × средняя наполняемость), расход — та же одна ставка.
 * Поэтому наполняемость группы бьёт по выручке занятия, а не «размазывает»
 * зарплату по ученикам: пустая группа — та же ставка, но меньше денег.
 *
 * Средние цены берём из факта CRM: сумма списаний за месяц ÷ число
 * списаний. Никаких прайсов и допущений — сколько реально списали,
 * столько и заработали.
 *
 * ПОСТОЯННЫХ РАСХОДОВ ЗДЕСЬ НЕТ. Маржинальность по определению считается
 * только на переменных затратах — тех, что возникают ровно потому, что урок
 * состоялся: зарплата педагога, взносы с неё, резерв отпускных, комиссия
 * эквайринга. Аренда, реклама и администрация покрываются уже из маржи.
 */

export type LessonForm = 'group' | 'individual';

/** Делитель отпускных: с каждого урока откладываем 1/8,1 начисленного. */
export const VACATION_DIVISOR = 8.1;

/** Ставки и проценты — общие для обеих форм занятий. */
export interface UnitRates {
  /** Страховые взносы за педагога, % от начисленной зарплаты. */
  sfrPercent: number;
  /** Комиссия интернет-эквайринга, % от оплаты родителя. */
  acquiringPercent: number;
  /** Делитель резерва отпускных. */
  vacationDivisor: number;
  /** Учитывать ли налог УСН в расчёте прибыли урока. */
  usnEnabled: boolean;
  /** Ставка УСН «Доходы», %. */
  usnPercent: number;
}

/** Параметры одной формы занятий. */
export interface UnitSide {
  /** Средняя цена, которую платит ОДИН ребёнок за занятие, ₽ (из CRM). */
  price: number;
  /** Ставка педагога за проведённый урок, ₽ — платится один раз за занятие. */
  rate: number;
  /** Средняя наполняемость занятия. Для индивидуальных всегда 1. */
  groupSize: number;
}

export interface UnitMarginInputs {
  periodMonth: string;
  individual: UnitSide;
  group: UnitSide;
  rates: UnitRates;
}

export interface CalcRow {
  label: string;
  value: number;
  /** Формула строкой — её показываем прямо в отчёте. */
  formula: string;
  hint?: string;
}

export interface UnitMarginResult {
  form: LessonForm;
  /** Средняя наполняемость занятия (для индивидуального — 1). */
  clientsPerLesson: number;
  /** Средняя цена, которую платит один ребёнок. Справочно. */
  pricePerClient: number;

  /** ВЫРУЧКА ЗАНЯТИЯ: цена × наполняемость. */
  revenue: number;
  revenueFormula: string;

  /** Разбор переменных расходов НА ЗАНЯТИЕ. */
  costRows: CalcRow[];
  costTotal: number;

  /** Маржинальная прибыль С ЗАНЯТИЯ: выручка − переменные расходы. */
  margin: number;
  /** Маржинальность занятия, %. */
  marginPercent: number;

  /** Налог УСН с занятия (0, если выключен). */
  tax: number;
  /** Прибыль с занятия после налога. */
  profit: number;
  profitPercent: number;

  /** Минимальная выручка занятия, ниже которой оно убыточно. */
  breakEvenRevenue: number;
  /** Сколько детей должно быть на занятии, чтобы выйти в ноль. */
  breakEvenClients: number;
  /** Доля зарплаты педагога (с взносами и отпускными) в выручке занятия, %. */
  payrollShare: number;
}

const round2 = (v: number) => Math.round(v * 100) / 100;
const safe = (v: number | undefined | null) => (Number.isFinite(v) ? (v as number) : 0);

export const fmtMoney = (v: number) => `${Math.round(safe(v)).toLocaleString('ru-RU')} ₽`;

export const fmtMoney2 = (v: number) =>
  `${round2(safe(v)).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₽`;

export const fmtPercent = (v: number) => `${round2(safe(v))}%`;

/**
 * Считает экономику одного урока выбранной формы.
 * Все формулы собраны здесь, чтобы каждую цифру отчёта можно было
 * пересчитать руками по строке, которая показана рядом в интерфейсе.
 */
export function calcUnit(
  form: LessonForm,
  side: UnitSide,
  rates: UnitRates,
): UnitMarginResult {
  const pricePerClient = safe(side.price);
  const rate = safe(side.rate);
  // Наполняемость занятия. У индивидуального ребёнок всегда один.
  const size = form === 'group' ? Math.max(0, safe(side.groupSize)) : 1;

  // ВЫРУЧКА ЗАНЯТИЯ — платит каждый пришедший ребёнок.
  const revenue = pricePerClient * size;
  const revenueFormula =
    form === 'group'
      ? `${fmtMoney2(pricePerClient)} × ${round2(size)} чел. = ${fmtMoney2(revenue)}`
      : `${fmtMoney2(pricePerClient)} за занятие`;

  const costRows: CalcRow[] = [];

  // 1. Зарплата педагога — одна ставка за проведённое занятие.
  //    НЕ делим на детей: педагогу платят за урок, а не за человека.
  const salary = rate;
  costRows.push({
    label: 'Зарплата педагога',
    value: salary,
    formula: `${fmtMoney(rate)} за проведённое занятие`,
    hint:
      form === 'group'
        ? 'Ставка за урок не зависит от числа детей в группе — платим один раз'
        : 'Ставка за проведённое индивидуальное занятие',
  });

  // 2. Страховые взносы — начисляются сверх зарплаты.
  const sfr = salary * (safe(rates.sfrPercent) / 100);
  costRows.push({
    label: 'Взносы в СФР',
    value: sfr,
    formula: `${fmtMoney2(salary)} × ${rates.sfrPercent}% = ${fmtMoney2(sfr)}`,
    hint: 'Страховые взносы платятся сверх зарплаты, это расход школы',
  });

  // 3. Резерв отпускных — копится с каждого отработанного урока.
  const divisor = safe(rates.vacationDivisor) || VACATION_DIVISOR;
  const vacation = salary / divisor;
  costRows.push({
    label: 'Резерв отпускных',
    value: vacation,
    formula: `${fmtMoney2(salary)} ÷ ${divisor} = ${fmtMoney2(vacation)}`,
    hint: 'С каждого урока откладываем 1/8,1 начисленного педагогу',
  });

  // 4. Эквайринг — процент со всех оплат этого занятия.
  const acquiring = revenue * (safe(rates.acquiringPercent) / 100);
  costRows.push({
    label: 'Интернет-эквайринг',
    value: acquiring,
    formula: `${fmtMoney2(revenue)} × ${rates.acquiringPercent}% = ${fmtMoney2(acquiring)}`,
    hint: 'Комиссия платёжного сервиса удерживается с каждой оплаты',
  });

  const costTotal = salary + sfr + vacation + acquiring;
  const margin = revenue - costTotal;

  const tax = rates.usnEnabled ? revenue * (safe(rates.usnPercent) / 100) : 0;
  const profit = margin - tax;

  // Безубыточность занятия: при какой выручке маржа обнулится.
  // От выручки зависят только эквайринг и налог, зарплата фиксирована.
  const variableRate =
    safe(rates.acquiringPercent) / 100 +
    (rates.usnEnabled ? safe(rates.usnPercent) / 100 : 0);
  const payroll = salary + sfr + vacation;
  const breakEvenRevenue = 1 - variableRate > 0 ? payroll / (1 - variableRate) : 0;
  // Сколько детей нужно на занятии при текущей цене.
  const breakEvenClients =
    pricePerClient > 0 ? breakEvenRevenue / pricePerClient : 0;

  return {
    form,
    clientsPerLesson: round2(size),
    pricePerClient: round2(pricePerClient),
    revenue: round2(revenue),
    revenueFormula,
    costRows,
    costTotal: round2(costTotal),
    margin: round2(margin),
    marginPercent: revenue > 0 ? round2((margin / revenue) * 100) : 0,
    tax: round2(tax),
    profit: round2(profit),
    profitPercent: revenue > 0 ? round2((profit / revenue) * 100) : 0,
    breakEvenRevenue: round2(breakEvenRevenue),
    breakEvenClients: round2(breakEvenClients),
    payrollShare: revenue > 0 ? round2((payroll / revenue) * 100) : 0,
  };
}

export interface UnitMarginResults {
  individual: UnitMarginResult;
  group: UnitMarginResult;
}

export const calcAll = (input: UnitMarginInputs): UnitMarginResults => ({
  individual: calcUnit('individual', input.individual, input.rates),
  group: calcUnit('group', input.group, input.rates),
});

export const DEFAULT_RATES: UnitRates = {
  sfrPercent: 30,
  acquiringPercent: 3.19,
  vacationDivisor: VACATION_DIVISOR,
  usnEnabled: true,
  usnPercent: 6,
};

/** Ставка педагога по умолчанию, ₽ за проведённый урок. */
export const DEFAULT_TEACHER_RATE = 650;

/**
 * Последний закрытый месяц — им открывается отчёт.
 * В текущем месяце занятия ещё идут, средняя цена урока будет неполной.
 */
export const lastClosedMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const MONTHS = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
];

export const monthLabel = (m: string) => {
  const [y, mm] = String(m || '').split('-');
  const idx = Number(mm) - 1;
  return MONTHS[idx] ? `${MONTHS[idx]} ${y}` : m;
};

/** Последние N месяцев, начиная с текущего. */
export const recentMonths = (count = 24): string[] => {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < count; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
};