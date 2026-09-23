/**
 * Маржинальность абонемента: модель расчёта.
 *
 * Считаем «юнит-экономику» одного абонемента: сколько денег он приносит за
 * месяц и во что обходится. Все формулы собраны здесь, а не размазаны по
 * компонентам — отчёт должен быть проверяемым, и каждую цифру можно
 * пересчитать руками по формуле, которая показана рядом в интерфейсе.
 *
 * Логика в двух словах
 * --------------------
 * 1. ВЫРУЧКА. Абонемент — это пакет занятий. В месяц ребёнок «съедает»
 *    столько уроков, сколько их в неделю × среднее число недель (4,33).
 *    Выручка за месяц = цена занятия × уроков в месяц.
 *
 * 2. ПРЯМЫЕ расходы — то, что тратится на конкретного ребёнка:
 *    - зарплата педагога. Индивидуальный урок оплачивается целиком, а час
 *      групповой работы делится между детьми в группе: один ребёнок в группе
 *      из 4 забирает четверть ставки;
 *    - взносы в СФР — процент от зарплаты (по умолчанию 30%);
 *    - отпускные — 1/8,1 от начисленного за урок (отпуск копится с каждого
 *      отработанного урока);
 *    - эквайринг — процент от выручки (деньги родитель платит картой).
 *
 * 3. КОСВЕННЫЕ расходы — школа целиком: зарплаты не-педагогов, реклама,
 *    ПО, бухгалтер, налог УСН. На один абонемент они ложатся долей:
 *    доля = уроки этого абонемента / все ученико-уроки школы за месяц.
 *    Так дорогой абонемент с большим числом занятий честно забирает
 *    бо́льшую часть общих расходов.
 *
 * 4. УСН 6%. Налог платится с дохода, но уменьшается на страховые взносы —
 *    для ИП с работниками не более чем вполовину. Это и считаем.
 */

export type LessonForm = 'group' | 'individual';

/** Среднее число недель в месяце: 365 / 12 / 7. */
export const WEEKS_IN_MONTH = 4.33;

/** Делитель отпускных: с каждого урока откладываем 1/8,1 начисленного. */
export const VACATION_DIVISOR = 8.1;

export interface TeacherLine {
  id: string;
  /** Имя педагога — подтягивается из CRM или вводится руками. */
  name: string;
  form: LessonForm;
  /** Ставка педагога за один урок, ₽. */
  rate: number;
  /** Сколько таких уроков в неделю входит в абонемент. */
  perWeek: number;
  /** Средний размер группы. Для индивидуальных всегда 1. */
  groupSize: number;
}

export interface IndirectLine {
  id: string;
  label: string;
  /** Сумма в месяц, ₽. */
  amount: number;
  /** Процент от выручки школы — для РУО и подобных надбавок. */
  percentOfRevenue?: number;
  hint?: string;
}

export interface MarginInputs {
  /** Название абонемента и его ключ в CRM. */
  tariffKey: string;
  tariffName: string;
  periodMonth: string;

  /** Цена абонемента целиком и число занятий в нём. */
  tariffPrice: number;
  tariffLessons: number;
  /** Срок абонемента в месяцах — по нему раскладываем цену на месяцы. */
  tariffMonths: number;

  /** Из чего состоит неделя ребёнка. */
  teachers: TeacherLine[];

  /** Прямые проценты. */
  sfrPercent: number;
  acquiringPercent: number;
  vacationDivisor: number;

  /** Косвенные: строки расходов школы. */
  indirect: IndirectLine[];

  /** Масштаб школы за месяц — нужен, чтобы разнести косвенные расходы. */
  schoolRevenue: number;
  schoolStudentLessons: number;

  /** Налог УСН. */
  usnPercent: number;
  /** Можно ли уменьшать налог на взносы и на сколько максимум (ИП с работниками — 50%). */
  usnReduceLimitPercent: number;
}

export interface CalcRow {
  label: string;
  value: number;
  /** Формула строкой — её показываем прямо в отчёте. */
  formula: string;
  hint?: string;
}

export interface MarginResult {
  /** Уроков в неделю и в месяц по абонементу. */
  lessonsPerWeek: number;
  lessonsPerMonth: number;
  pricePerLesson: number;

  revenue: number;
  revenueRows: CalcRow[];

  directRows: CalcRow[];
  directTotal: number;

  indirectRows: CalcRow[];
  indirectTotal: number;
  /** Какая доля школьных расходов легла на абонемент, 0..1. */
  indirectShare: number;

  taxRows: CalcRow[];
  taxTotal: number;

  grossProfit: number;
  grossMarginPercent: number;
  netProfit: number;
  netMarginPercent: number;

  /** Сколько прибыли приносит один урок — удобно сравнивать тарифы. */
  profitPerLesson: number;
  /** Порог: ниже этой цены занятия абонемент уходит в минус. */
  breakEvenPricePerLesson: number;
}

const round2 = (v: number) => Math.round(v * 100) / 100;
/** Пустое поле формы даёт undefined/NaN — в расчёте это всегда ноль. */
const safe = (v: number | undefined | null) => (Number.isFinite(v) ? (v as number) : 0);

export const fmtMoney = (v: number) =>
  `${Math.round(safe(v)).toLocaleString('ru-RU')} ₽`;

export const fmtMoney2 = (v: number) =>
  `${round2(safe(v)).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`;

export const fmtPercent = (v: number) => `${round2(safe(v))}%`;

/** Цена одного занятия по абонементу. */
export const pricePerLessonOf = (price: number, lessons: number) =>
  lessons > 0 ? price / lessons : 0;

export function calcMargin(input: MarginInputs): MarginResult {
  const weeks = WEEKS_IN_MONTH;
  const lessonsPerWeek = input.teachers.reduce((s, t) => s + safe(t.perWeek), 0);
  const lessonsPerMonth = lessonsPerWeek * weeks;
  const pricePerLesson = pricePerLessonOf(input.tariffPrice, input.tariffLessons);

  // ---------- выручка ----------
  const revenue = pricePerLesson * lessonsPerMonth;
  const revenueRows: CalcRow[] = [
    {
      label: 'Цена занятия',
      value: pricePerLesson,
      formula: `${fmtMoney(input.tariffPrice)} ÷ ${input.tariffLessons} зан. = ${fmtMoney2(pricePerLesson)}`,
      hint: 'Цена абонемента, делённая на число занятий в нём',
    },
    {
      label: 'Занятий в месяц',
      value: lessonsPerMonth,
      formula: `${lessonsPerWeek} в неделю × ${weeks} нед. = ${round2(lessonsPerMonth)}`,
      hint: 'В среднем в месяце 4,33 недели (365 ÷ 12 ÷ 7)',
    },
    {
      label: 'Выручка с ученика за месяц',
      value: revenue,
      formula: `${fmtMoney2(pricePerLesson)} × ${round2(lessonsPerMonth)} = ${fmtMoney(revenue)}`,
    },
  ];

  // ---------- прямые ----------
  const directRows: CalcRow[] = [];

  // Зарплата педагогов. Групповой урок делим на число детей в группе:
  // абонемент оплачивает только свою долю часа.
  let teacherSalary = 0;
  input.teachers.forEach((t) => {
    const size = t.form === 'group' ? Math.max(1, safe(t.groupSize)) : 1;
    const perMonth = safe(t.perWeek) * weeks;
    const cost = (safe(t.rate) / size) * perMonth;
    teacherSalary += cost;
    directRows.push({
      label: `ЗП: ${t.name || 'педагог'} (${t.form === 'group' ? 'группа' : 'индивид.'})`,
      value: cost,
      formula:
        t.form === 'group'
          ? `${fmtMoney(t.rate)} ÷ ${size} чел. × ${round2(perMonth)} зан. = ${fmtMoney(cost)}`
          : `${fmtMoney(t.rate)} × ${round2(perMonth)} зан. = ${fmtMoney(cost)}`,
      hint:
        t.form === 'group'
          ? 'Час групповой работы делится между детьми в группе'
          : 'Индивидуальный урок оплачивается целиком',
    });
  });

  const sfr = teacherSalary * (safe(input.sfrPercent) / 100);
  directRows.push({
    label: 'Взносы в СФР за педагогов',
    value: sfr,
    formula: `${fmtMoney(teacherSalary)} × ${input.sfrPercent}% = ${fmtMoney(sfr)}`,
    hint: 'Страховые взносы начисляются сверх зарплаты',
  });

  const divisor = safe(input.vacationDivisor) || VACATION_DIVISOR;
  const vacation = teacherSalary / divisor;
  directRows.push({
    label: 'Резерв отпускных',
    value: vacation,
    formula: `${fmtMoney(teacherSalary)} ÷ ${divisor} = ${fmtMoney(vacation)}`,
    hint: 'С каждого урока откладываем 1/8,1 начисленного педагогу',
  });

  const acquiring = revenue * (safe(input.acquiringPercent) / 100);
  directRows.push({
    label: 'Интернет-эквайринг',
    value: acquiring,
    formula: `${fmtMoney(revenue)} × ${input.acquiringPercent}% = ${fmtMoney(acquiring)}`,
    hint: 'Комиссия платёжного сервиса удерживается с каждой оплаты',
  });

  const directTotal = teacherSalary + sfr + vacation + acquiring;

  // ---------- косвенные ----------
  // Доля абонемента в школе: по числу занятий. Если данных о масштабе школы
  // нет — косвенные не разносим, иначе получили бы бессмысленный ноль.
  const schoolLessons = safe(input.schoolStudentLessons);
  const indirectShare = schoolLessons > 0 ? lessonsPerMonth / schoolLessons : 0;

  const indirectRows: CalcRow[] = [];
  let indirectFull = 0;
  input.indirect.forEach((line) => {
    const byPercent = safe(line.percentOfRevenue)
      ? safe(input.schoolRevenue) * (safe(line.percentOfRevenue) / 100)
      : 0;
    const full = safe(line.amount) + byPercent;
    indirectFull += full;
    const share = full * indirectShare;
    indirectRows.push({
      label: line.label,
      value: share,
      formula: line.percentOfRevenue
        ? `(${fmtMoney(line.amount)} + ${line.percentOfRevenue}% от ${fmtMoney(input.schoolRevenue)}) × ${round2(indirectShare * 100)}% = ${fmtMoney(share)}`
        : `${fmtMoney(full)} × ${round2(indirectShare * 100)}% = ${fmtMoney(share)}`,
      hint: line.hint,
    });
  });
  const indirectTotal = indirectFull * indirectShare;

  // ---------- налог ----------
  // УСН «Доходы»: налог с выручки, уменьшенный на страховые взносы,
  // но не больше чем наполовину (ИП с работниками).
  const usnBase = revenue * (safe(input.usnPercent) / 100);
  const limit = usnBase * (safe(input.usnReduceLimitPercent) / 100);
  const reduction = Math.min(sfr, limit);
  const taxTotal = Math.max(0, usnBase - reduction);
  const taxRows: CalcRow[] = [
    {
      label: `Налог УСН ${input.usnPercent}%`,
      value: usnBase,
      formula: `${fmtMoney(revenue)} × ${input.usnPercent}% = ${fmtMoney(usnBase)}`,
    },
    {
      label: 'Вычет страховых взносов',
      value: -reduction,
      formula: `min(взносы ${fmtMoney(sfr)}; ${input.usnReduceLimitPercent}% налога ${fmtMoney(limit)}) = ${fmtMoney(reduction)}`,
      hint: 'ИП с работниками уменьшает налог на взносы не более чем на половину',
    },
    {
      label: 'Налог к уплате',
      value: taxTotal,
      formula: `${fmtMoney(usnBase)} − ${fmtMoney(reduction)} = ${fmtMoney(taxTotal)}`,
    },
  ];

  // ---------- итоги ----------
  const grossProfit = revenue - directTotal;
  const netProfit = grossProfit - indirectTotal - taxTotal;

  // Точка безубыточности: при какой цене занятия прибыль обнулится.
  // Из уравнения цена × N − прямые(цена) − косвенные − налог = 0,
  // где от цены зависят только эквайринг и налог.
  const variableRate =
    safe(input.acquiringPercent) / 100 +
    (safe(input.usnPercent) / 100) * (1 - safe(input.usnReduceLimitPercent) / 100);
  const fixedPart = teacherSalary + sfr + vacation + indirectTotal;
  const breakEvenPricePerLesson =
    lessonsPerMonth > 0 && 1 - variableRate > 0
      ? fixedPart / (lessonsPerMonth * (1 - variableRate))
      : 0;

  return {
    lessonsPerWeek,
    lessonsPerMonth: round2(lessonsPerMonth),
    pricePerLesson: round2(pricePerLesson),
    revenue: round2(revenue),
    revenueRows,
    directRows,
    directTotal: round2(directTotal),
    indirectRows,
    indirectTotal: round2(indirectTotal),
    indirectShare,
    taxRows,
    taxTotal: round2(taxTotal),
    grossProfit: round2(grossProfit),
    grossMarginPercent: revenue > 0 ? round2((grossProfit / revenue) * 100) : 0,
    netProfit: round2(netProfit),
    netMarginPercent: revenue > 0 ? round2((netProfit / revenue) * 100) : 0,
    profitPerLesson: lessonsPerMonth > 0 ? round2(netProfit / lessonsPerMonth) : 0,
    breakEvenPricePerLesson: round2(breakEvenPricePerLesson),
  };
}

/** Косвенные расходы школы «как сейчас» — стартовое заполнение формы. */
export const DEFAULT_INDIRECT: IndirectLine[] = [
  { id: 'owner', label: 'Собственник-руководитель', amount: 300000 },
  {
    id: 'ruo',
    label: 'РУО (1/2 ставки)',
    amount: 60000,
    percentOfRevenue: 1,
    hint: '60 000 ₽ оклад + 1% от доходов школы за месяц',
  },
  {
    id: 'admins',
    label: 'Администраторы',
    amount: 21000,
    hint: '700 ₽ за смену × 30 смен в месяц',
  },
  { id: 'dev', label: 'Разработчик (1/3 ставки)', amount: 40000 },
  {
    id: 'designers',
    label: 'Дизайнеры презентаций',
    amount: 25000,
    hint: '250 ₽ за слайд, 3 человека — поставьте фактическую сумму месяца',
  },
  { id: 'accountant', label: 'Бухгалтер', amount: 15000 },
  {
    id: 'ads',
    label: 'Реклама',
    amount: 78000,
    hint: '18 000 ₽ в неделю × 4,33 недели',
  },
  { id: 'software', label: 'ПО и сервисы', amount: 50000 },
];

export const DEFAULT_RATES = {
  sfrPercent: 30,
  acquiringPercent: 3.19,
  vacationDivisor: VACATION_DIVISOR,
  usnPercent: 6,
  usnReduceLimitPercent: 50,
};

/** Текущий месяц в формате YYYY-MM. */
export const currentMonth = () => new Date().toISOString().slice(0, 7);

/**
 * Последний закрытый месяц — им открывается отчёт.
 * В текущем месяце занятия ещё идут, и объём школы неполный: считать по нему
 * маржинальность бессмысленно, цифры будут занижены.
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
  const [y, mm] = m.split('-');
  const idx = Number(mm) - 1;
  return MONTHS[idx] ? `${MONTHS[idx]} ${y}` : m;
};

/** Последние N месяцев, начиная с текущего. */
export const recentMonths = (count = 18): string[] => {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < count; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
};