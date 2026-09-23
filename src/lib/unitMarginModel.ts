/**
 * Маржинальность ОДНОГО УРОКА — юнит-экономика без абонементов.
 *
 * Почему не по абонементам. У детей одновременно живут действующие,
 * архивные и совсем доисторические абонементы с разными ценами и составом.
 * Средняя «по абонементу» получается ни о чём: сравнивать месяцы нечем.
 * Единственный юнит, который одинаково устроен в любом месяце, — ОДИН
 * ПРОВЕДЁННЫЙ УРОК. Его и считаем.
 *
 * Два юнита считаем параллельно и независимо:
 *   • ИНДИВИДУАЛЬНЫЙ урок — один ребёнок, одна оплата, одна ставка педагога;
 *   • ГРУППОВОЙ урок В РАСЧЁТЕ НА ОДНОГО ЧЕЛОВЕКА — ребёнок платит за себя,
 *     а час работы педагога делится между всеми детьми в группе. Поэтому
 *     себестоимость группового юнита = ставка ÷ средний размер группы.
 *
 * Выручка юнита берётся из факта CRM: сумма списаний за месяц ÷ число
 * списаний. Никаких прайсов и допущений — сколько реально списали, столько
 * и заработали.
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
  /** Средняя цена юнита из CRM, ₽ (можно поправить руками). */
  price: number;
  /** Ставка педагога за проведённый урок, ₽. */
  rate: number;
  /** Средний размер группы. Для индивидуальных всегда 1. */
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
  /** Выручка с одного юнита. */
  price: number;
  /** Разбор переменных расходов. */
  costRows: CalcRow[];
  costTotal: number;
  /** Маржинальная прибыль с урока: цена − переменные расходы. */
  margin: number;
  /** Маржинальность, %. */
  marginPercent: number;
  /** Налог УСН с этого урока (0, если выключен). */
  tax: number;
  /** Прибыль после налога. */
  profit: number;
  profitPercent: number;
  /** Ниже этой цены урок уходит в минус. */
  breakEvenPrice: number;
  /** Доля зарплаты педагога (с взносами и отпускными) в цене урока, %. */
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
  const price = safe(side.price);
  const rate = safe(side.rate);
  const size = form === 'group' ? Math.max(1, safe(side.groupSize) || 1) : 1;

  const costRows: CalcRow[] = [];

  // 1. Зарплата педагога на один юнит.
  const salary = rate / size;
  costRows.push({
    label: 'Зарплата педагога',
    value: salary,
    formula:
      form === 'group'
        ? `${fmtMoney(rate)} ÷ ${round2(size)} чел. = ${fmtMoney2(salary)}`
        : `${fmtMoney(rate)} за урок = ${fmtMoney2(salary)}`,
    hint:
      form === 'group'
        ? 'Час групповой работы делится между детьми в группе: ребёнок оплачивает свою долю'
        : 'Индивидуальный урок педагог ведёт для одного ребёнка — ставка целиком',
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

  // 4. Эквайринг — процент с оплаты родителя.
  const acquiring = price * (safe(rates.acquiringPercent) / 100);
  costRows.push({
    label: 'Интернет-эквайринг',
    value: acquiring,
    formula: `${fmtMoney2(price)} × ${rates.acquiringPercent}% = ${fmtMoney2(acquiring)}`,
    hint: 'Комиссия платёжного сервиса удерживается с каждой оплаты',
  });

  const costTotal = salary + sfr + vacation + acquiring;
  const margin = price - costTotal;

  const tax = rates.usnEnabled ? price * (safe(rates.usnPercent) / 100) : 0;
  const profit = margin - tax;

  // Точка безубыточности: при какой цене урок выходит в ноль.
  // От цены зависят только эквайринг и налог, остальное фиксировано.
  const variableRate =
    safe(rates.acquiringPercent) / 100 +
    (rates.usnEnabled ? safe(rates.usnPercent) / 100 : 0);
  const fixedPart = salary + sfr + vacation;
  const breakEvenPrice = 1 - variableRate > 0 ? fixedPart / (1 - variableRate) : 0;

  return {
    form,
    price: round2(price),
    costRows,
    costTotal: round2(costTotal),
    margin: round2(margin),
    marginPercent: price > 0 ? round2((margin / price) * 100) : 0,
    tax: round2(tax),
    profit: round2(profit),
    profitPercent: price > 0 ? round2((profit / price) * 100) : 0,
    breakEvenPrice: round2(breakEvenPrice),
    payrollShare: price > 0 ? round2(((salary + sfr + vacation) / price) * 100) : 0,
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
