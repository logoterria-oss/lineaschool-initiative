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
  /** Постоянные расходы школы за месяц — нужны только для точки безубыточности. */
  fixed?: FixedLine[];
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
  /** Сколько клиентов приходится на одно занятие (для индивидуального — 1). */
  clientsPerLesson: number;
  /** Выручка с одного КЛИЕНТА. */
  price: number;
  /** Разбор переменных расходов на одного клиента. */
  costRows: CalcRow[];
  costTotal: number;
  /** Маржинальная прибыль с одного КЛИЕНТА: цена − переменные расходы. */
  margin: number;
  /** Маржинальность, %. Одинакова и на клиента, и на занятие целиком. */
  marginPercent: number;
  /** Налог УСН с одного клиента (0, если выключен). */
  tax: number;
  /** Прибыль с клиента после налога. */
  profit: number;
  profitPercent: number;
  /** Ниже этой цены занятие уходит в минус. */
  breakEvenPrice: number;
  /** Доля зарплаты педагога (с взносами и отпускными) в цене, %. */
  payrollShare: number;

  /* Итоги на ВСЁ занятие целиком: у группы это сумма по всем детям,
     у индивидуального совпадает с показателями на клиента. */
  lessonRevenue: number;
  lessonCost: number;
  lessonMargin: number;
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

  // 1. Зарплата педагога в пересчёте на одного клиента.
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
    clientsPerLesson: round2(size),
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
    // Занятие целиком: платит каждый ребёнок, а ставку педагога школа
    // отдаёт один раз за урок — поэтому в группе маржа с занятия кратно
    // больше, чем с одного клиента.
    lessonRevenue: round2(price * size),
    lessonCost: round2(costTotal * size),
    lessonMargin: round2(margin * size),
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

/* ------------------------------------------------------------------ *
 *  ТОЧКА БЕЗУБЫТОЧНОСТИ В УРОКАХ
 *
 *  Маржинальность отвечает на вопрос «сколько остаётся с урока».
 *  Безубыточность отвечает на другой: СКОЛЬКО ТАКИХ УРОКОВ НУЖНО ПРОВЕСТИ
 *  ЗА МЕСЯЦ, чтобы этих остатков хватило на всю постоянку школы.
 *
 *  Считаем на ЗАНЯТИЕ ЦЕЛИКОМ, а не на ученика: педагогу платят один раз
 *  за урок, а платят за него все дети группы. Вклад одного группового
 *  урока в покрытие постоянных = (цена с человека − переменные на
 *  человека − налог) × средний размер группы.
 *
 *  Строки «% от выручки» (РУО и т.п.) растут вместе с объёмом, поэтому
 *  они вычитаются из вклада урока, а не из фиксированной суммы:
 *      N = Фикс ÷ (Вклад урока − % × Выручка урока)
 * ------------------------------------------------------------------ */

/** Строка постоянных расходов школы за месяц. */
export interface FixedLine {
  id: string;
  label: string;
  /** Сумма в месяц, ₽. */
  amount: number;
  /** Дополнительно процент от выручки школы (для РУО и подобных надбавок). */
  percentOfRevenue?: number;
  hint?: string;
}

export interface BreakEvenSide {
  form: LessonForm;
  /** Вклад одного ЗАНЯТИЯ в покрытие постоянных расходов, ₽. */
  contributionPerLesson: number;
  /** Занятий в месяц до нуля. Infinity — вклад не покрывает даже процентные расходы. */
  lessonsPerMonth: number;
  /** То же в неделю и в рабочий день (26 дней). */
  lessonsPerWeek: number;
  lessonsPerDay: number;
  /** Выручка школы в точке безубыточности, ₽/мес. */
  revenueAtBreakEven: number;
  /** Сколько ученико-мест это значит: занятий × размер группы. */
  seatsPerMonth: number;
  formula: string;
}

export interface BreakEvenResult {
  /** Постоянные расходы, фиксированная часть, ₽/мес. */
  fixedTotal: number;
  /** Суммарный процент от выручки по строкам постоянных, %. */
  fixedPercentOfRevenue: number;
  /** Сценарий «только групповые» и «только индивидуальные». */
  group: BreakEvenSide;
  individual: BreakEvenSide;
  /** Сколько индивидуальных уроков уже есть (факт месяца) — вход в смешанный сценарий. */
  individualLessonsFact: number;
  /** Сколько групповых нужно сверх этого факта индивидуальных. */
  groupLessonsWithIndividual: number;
  /** Сколько групповых уже провели по факту. */
  groupLessonsFact: number;
  /** Разрыв: факт минус норма (отрицательный — не дотягиваем). */
  groupGap: number;
}

/** Рабочих дней в месяце для пересчёта «уроков в день». */
export const WORK_DAYS_IN_MONTH = 26;
/** Недель в месяце: 365 ÷ 12 ÷ 7. */
export const WEEKS_IN_MONTH = 4.33;

const sideBreakEven = (
  r: UnitMarginResult,
  fixedBase: number,
  percentOfRevenue: number,
): BreakEvenSide => {
  const size = r.form === 'group' ? Math.max(1, r.clientsPerLesson) : 1;
  const revenuePerLesson = r.price * size;
  // Вклад урока: прибыль с клиента после налога × число клиентов на уроке.
  const gross = r.profit * size;
  const contribution = gross - revenuePerLesson * (percentOfRevenue / 100);
  const lessons = contribution > 0 ? fixedBase / contribution : Infinity;

  return {
    form: r.form,
    contributionPerLesson: round2(contribution),
    lessonsPerMonth: Number.isFinite(lessons) ? Math.ceil(lessons) : Infinity,
    lessonsPerWeek: Number.isFinite(lessons) ? round2(lessons / WEEKS_IN_MONTH) : Infinity,
    lessonsPerDay: Number.isFinite(lessons) ? round2(lessons / WORK_DAYS_IN_MONTH) : Infinity,
    revenueAtBreakEven: Number.isFinite(lessons) ? round2(lessons * revenuePerLesson) : 0,
    seatsPerMonth: Number.isFinite(lessons) ? Math.ceil(lessons * size) : Infinity,
    formula: Number.isFinite(lessons)
      ? `${fmtMoney(fixedBase)} ÷ ${fmtMoney2(contribution)} = ${Math.ceil(lessons)} зан.`
      : 'вклад урока ≤ 0 — безубыточность недостижима при этой цене',
  };
};

export interface BreakEvenInput {
  results: UnitMarginResults;
  fixed: FixedLine[];
  /** Факт месяца: сколько занятий каждой формы реально провели. */
  individualLessonsFact: number;
  groupLessonsFact: number;
}

export function calcBreakEven(input: BreakEvenInput): BreakEvenResult {
  const fixedTotal = input.fixed.reduce((s, l) => s + safe(l.amount), 0);
  const percent = input.fixed.reduce((s, l) => s + safe(l.percentOfRevenue), 0);

  const group = sideBreakEven(input.results.group, fixedTotal, percent);
  const individual = sideBreakEven(input.results.individual, fixedTotal, percent);

  // Смешанный сценарий: индивидуальные уроки идут как есть, их вклад
  // уменьшает остаток постоянных — добираем группами.
  const indivLessons = Math.max(0, safe(input.individualLessonsFact));
  const coveredByIndividual = individual.contributionPerLesson * indivLessons;
  const rest = Math.max(0, fixedTotal - coveredByIndividual);
  const groupWithIndividual =
    group.contributionPerLesson > 0 ? Math.ceil(rest / group.contributionPerLesson) : Infinity;

  return {
    fixedTotal: round2(fixedTotal),
    fixedPercentOfRevenue: round2(percent),
    group,
    individual,
    individualLessonsFact: indivLessons,
    groupLessonsWithIndividual: groupWithIndividual,
    groupLessonsFact: Math.max(0, safe(input.groupLessonsFact)),
    groupGap: Number.isFinite(groupWithIndividual)
      ? Math.max(0, safe(input.groupLessonsFact)) - groupWithIndividual
      : -Infinity,
  };
}

/** Постоянные расходы школы «как сейчас» — стартовое заполнение формы. */
export const DEFAULT_FIXED: FixedLine[] = [
  { id: 'owner', label: 'Собственник-руководитель', amount: 300000 },
  {
    id: 'ruo',
    label: 'РУО (1/2 ставки)',
    amount: 60000,
    percentOfRevenue: 1,
    hint: '60 000 ₽ оклад + 1% от выручки школы',
  },
  { id: 'admins', label: 'Администраторы', amount: 21000, hint: '700 ₽ × 30 смен' },
  { id: 'dev', label: 'Разработчик (1/3 ставки)', amount: 40000 },
  { id: 'designers', label: 'Дизайнеры презентаций', amount: 25000 },
  { id: 'accountant', label: 'Бухгалтер', amount: 15000 },
  { id: 'ads', label: 'Реклама', amount: 78000, hint: '18 000 ₽ в неделю × 4,33' },
  { id: 'software', label: 'ПО и сервисы', amount: 50000 },
];

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