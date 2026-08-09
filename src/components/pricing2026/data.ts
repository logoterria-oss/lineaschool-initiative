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
  description: string;
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
 * Абонементы строятся из трёх чисел: цена урока в минимальном пакете,
 * состав недели (сколько групповых и индивидуальных) и длительность.
 * Скидка за 3 и 6 месяцев одинаковая во всех тарифах — 5% и 10%,
 * цена урока округляется до десятков рублей.
 */
const buildPlans = (basePrice: number, groupPerWeek: number, individualPerWeek: number): Plan[] => {
  const steps = [
    { title: '1 месяц', weeks: 4, discount: 0, interim: 0 },
    { title: '3 месяца', weeks: 12, discount: 5, interim: 1, popular: true },
    { title: '6 месяцев', weeks: 24, discount: 10, interim: 2 },
  ];

  return steps.map(({ title, weeks, discount, interim, popular }) => {
    const group = groupPerWeek * weeks;
    const individual = individualPerWeek * weeks;
    const lessons = group + individual;
    const pricePerLesson = discount
      ? Math.round((basePrice * (1 - discount / 100)) / 10) * 10
      : basePrice;

    return {
      title,
      // В общем числе занятий учитываем и промежуточные диагностики:
      // они входят в абонемент как обычная встреча, а не идут подарком.
      totalLessons: lessons + interim,
      groupLessons: group,
      individualLessons: individual,
      pricePerLesson,
      // Стоимость считается только по учебным занятиям — диагностики
      // цену абонемента не увеличивают.
      totalPrice: pricePerLesson * lessons,
      discountPercent: discount || undefined,
      interimDiagnostics: interim || undefined,
      popular,
    };
  });
};

export const pricingSections: PricingSection[] = [
  {
    title: '2 урока в неделю',
    subtitle: '2 групповых',
    description: 'Лёгкая степень выраженности дислексии/дисграфии',
    plans: buildPlans(1370, 2, 0),
  },
  {
    title: '3 урока в неделю',
    subtitle: '2 групповых + 1 индивидуальный',
    description: 'Средняя степень выраженности дислексии/дисграфии',
    plans: buildPlans(1470, 2, 1),
  },
  {
    title: '4 урока в неделю',
    subtitle: '2 групповых + 2 индивидуальных',
    description: 'Тяжёлая степень выраженности дислексии/дисграфии',
    plans: buildPlans(1510, 2, 2),
  },
];

export type IndividualPlan = {
  lessons: number;
  pricePerLesson: number;
  totalPrice: number;
  popular?: boolean;
};

export const individualPlans: IndividualPlan[] = [
  { lessons: 4, pricePerLesson: 2200, totalPrice: 8800 },
  { lessons: 8, pricePerLesson: 2100, totalPrice: 16800, popular: true },
  { lessons: 12, pricePerLesson: 2000, totalPrice: 24000 },
];