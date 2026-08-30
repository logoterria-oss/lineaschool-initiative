export type Plan = {
  title: string;
  totalLessons: number;
  groupLessons: number;
  individualLessons: number;
  pricePerLesson: number;
  totalPrice: number;
  discountPercent?: number;
  interimDiagnostics?: number;
  popular?: boolean;
};

export type PricingSection = {
  title: string;
  subtitle: string;
  /** Кому подходит абонемент: одна формулировка или список случаев. */
  description: string | string[];
  plans: Plan[];
};

export const formatPrice = (value: number) =>
  `${value.toLocaleString('ru-RU')} \u20BD`;

/** Первичная диагностика — по акции до последнего числа текущего месяца. */
export const DIAGNOSTIC_PRIMARY = { price: 1490, oldPrice: 4500 };

/** Промежуточная диагностика — контроль динамики в процессе обучения. */
export const DIAGNOSTIC_INTERIM = { price: 2000 };

export const getPromoDeadline = () => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
  ];
  return `${lastDay.getDate()} ${months[lastDay.getMonth()]}`;
};

/**
 * Абонемент — это пакет занятий: групповые, индивидуальные и промежуточные
 * диагностики. Диагностика входит в абонемент как обычное занятие, а не идёт
 * бонусом: в счёте занятий она учитывается наравне с уроками.
 *
 * Считаем так: полная стоимость = уроки по базовой цене + диагностики по своей
 * цене. От неё берём скидку за длительность и делим на общее число занятий —
 * получается единая цена занятия, округлённая до десятков рублей. Итог
 * абонемента = цена занятия × количество занятий, поэтому в карточке всё
 * сходится: 1 300 ₽ × 25 = 32 500 ₽.
 */
const buildPlans = (
  basePrice: number,
  groupPerWeek: number,
  individualPerWeek: number,
  discounts: { quarter: number; half: number },
  // Ручная цена занятия для отдельных сроков: иногда её назначают «от руки»,
  // и тогда она важнее расчётной.
  manualPrice: { quarter?: number; half?: number } = {},
): Plan[] => {
  const steps = [
    { title: '1 месяц', weeks: 4, discount: 0, interim: 0, manual: undefined },
    {
      title: '3 месяца',
      weeks: 12,
      discount: discounts.quarter,
      interim: 1,
      popular: true,
      manual: manualPrice.quarter,
    },
    {
      title: '6 месяцев',
      weeks: 24,
      discount: discounts.half,
      interim: 2,
      manual: manualPrice.half,
    },
  ];

  return steps.map(({ title, weeks, discount, interim, popular, manual }) => {
    const group = groupPerWeek * weeks;
    const individual = individualPerWeek * weeks;
    const lessons = group + individual + interim;

    const fullPrice = basePrice * (group + individual) + DIAGNOSTIC_INTERIM.price * interim;
    const pricePerLesson =
      manual ?? Math.round((fullPrice * (1 - discount / 100)) / lessons / 10) * 10;
    const totalPrice = pricePerLesson * lessons;

    // Процент на бейдже считаем от итоговой цены, а не берём заданный:
    // после округления цены занятия реальная выгода может отличаться.
    const realDiscount = Math.round((1 - totalPrice / fullPrice) * 100);

    return {
      title,
      totalLessons: lessons,
      groupLessons: group,
      individualLessons: individual,
      pricePerLesson,
      totalPrice,
      discountPercent: realDiscount > 0 ? realDiscount : undefined,
      interimDiagnostics: interim || undefined,
      popular,
    };
  });
};

export const pricingSections: PricingSection[] = [
  {
    title: '2 урока в неделю',
    subtitle: '2 групповых',
    description: ['Регуляторная дисграфия/дислексия'],
    plans: buildPlans(1370, 2, 0, { quarter: 5, half: 10 }, { half: 1270 }),
  },
  {
    title: '3 урока в неделю',
    subtitle: '2 групповых + 1 индивидуальный',
    description: [
      'Регуляторная дислексия/дисграфия + дизорфография',
      'Смешанная форма дислексии/дисграфии с речевой симптоматикой',
      'Смешанная форма дислексии/дисграфии с оптико-моторной симптоматикой',
    ],
    plans: buildPlans(1470, 2, 1, { quarter: 5, half: 10 }),
  },
  {
    title: '4 урока в неделю',
    subtitle: '2 групповых + 2 индивидуальных',
    description: [
      'Смешанная форма дислексии/дисграфии + дизорфография',
      'Тяжёлая степень выраженности смешанной формы дислексии/дисграфии',
    ],
    plans: buildPlans(1510, 2, 2, { quarter: 5, half: 10 }),
  },
];

export type IndividualPlan = {
  lessons: number;
  pricePerLesson: number;
  totalPrice: number;
  popular?: boolean;
};

export const individualPlans: IndividualPlan[] = [
  { lessons: 8, pricePerLesson: 2200, totalPrice: 8 * 2200 },
  { lessons: 12, pricePerLesson: 2100, totalPrice: 12 * 2100, popular: true },
  { lessons: 16, pricePerLesson: 2000, totalPrice: 16 * 2000 },
];

/** Показания к индивидуальному формату — когда группа ребёнку не подходит. */
export const individualIndications = {
  intro:
    'Рекомендуется детям с тяжёлой речевой, оптико-моторной и мнестической симптоматикой, когда занятия в группах невозможны',
  signs: [
    'Заметные трудности в припоминании букв при письме и чтении',
    'Побуквенное чтение после 9 лет',
    'Стойкое зеркальное написание букв',
    'Грубое нарушение языкового анализа на уровне звуков, слов и предложений',
  ],
};