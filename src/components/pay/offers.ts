import {
  DIAGNOSTIC_INTERIM,
  DIAGNOSTIC_PRIMARY,
  individualIndications,
  individualPlans,
  pricingSections,
} from '@/components/pricing2026/data';

/** Один вариант оплаты внутри страницы: срок абонемента или разовая услуга. */
export type PayOption = {
  title: string;
  /** Цена за урок — показываем, когда в варианте несколько занятий. */
  pricePerLesson?: number;
  /** Сумма к оплате. */
  totalPrice: number;
  /** Старая цена — для наглядной выгоды по акции. */
  oldPrice?: number;
  discountPercent?: number;
  popular?: boolean;
  /** Состав: что входит в оплату. */
  details: { icon: string; color: string; text: string }[];
};

export type PayOffer = {
  slug: string;
  /** Заголовок страницы и назначение платежа в чеке. */
  title: string;
  subtitle?: string;
  description: string;
  /** Кому подходит — короткий список показаний. */
  indications?: string[];
  /** Подсказка над вариантами: что именно выбирает родитель. */
  chooseLabel?: string;
  options: PayOption[];
};

const lessonsWord = (count: number) => {
  if (count % 10 === 1 && count % 100 !== 11) return 'урок';
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'урока';
  return 'уроков';
};

/** Собирает состав занятий одинаково для всех абонементов. */
const composition = (group: number, individual: number, interim?: number) => {
  const rows: PayOption['details'] = [];
  if (group) rows.push({ icon: 'Users', color: 'text-blue-500', text: `${group} групповых` });
  if (individual)
    rows.push({ icon: 'User', color: 'text-green-500', text: `${individual} индивидуальных` });
  if (interim)
    rows.push({
      icon: 'ClipboardCheck',
      color: 'text-orange-500',
      text: `${interim} ${interim === 1 ? 'промежуточная диагностика' : 'промежуточные диагностики'}`,
    });
  return rows;
};

/** Страницы абонементов 2/3/4 урока в неделю — данные берём из общего прайса. */
const subscriptionOffers: PayOffer[] = pricingSections.map((section, index) => ({
  slug: `abonement-${index + 2}`,
  title: section.title,
  subtitle: section.subtitle,
  description:
    'Выберите срок абонемента: чем длиннее срок, тем выгоднее стоимость одного занятия',
  indications: Array.isArray(section.description) ? section.description : [section.description],
  chooseLabel: 'Срок абонемента',
  options: section.plans.map((plan) => ({
    title: plan.title,
    pricePerLesson: plan.pricePerLesson,
    totalPrice: plan.totalPrice,
    discountPercent: plan.discountPercent,
    popular: plan.popular,
    details: composition(plan.groupLessons, plan.individualLessons, plan.interimDiagnostics),
  })),
}));

/**
 * Архивный тариф — формат «1 индивидуальный + 1 групповой» из прошлого прайса.
 * Стоимость занятия подняли на 25%, скидки за длительность оставили едиными
 * с действующими абонементами: 5% за три месяца и 10% за полгода.
 */
const ARCHIVE_BASE_PRICE = Math.round((1370 * 1.25) / 10) * 10;

const archiveSteps = [
  { title: '1 месяц', weeks: 4, discount: 0, popular: false },
  { title: '3 месяца', weeks: 12, discount: 5, popular: true },
  { title: '6 месяцев', weeks: 24, discount: 10, popular: false },
];

const archiveOffer: PayOffer = {
  slug: 'abonement-archive-2',
  title: '2 урока в неделю (архивный тариф)',
  subtitle: '1 групповой + 1 индивидуальный',
  description:
    'Архивный формат занятий для тех, кто занимался у нас раньше: один групповой и один индивидуальный урок в неделю',
  chooseLabel: 'Срок абонемента',
  options: archiveSteps.map(({ title, weeks, discount, popular }) => {
    const group = weeks;
    const individual = weeks;
    const lessons = group + individual;
    const pricePerLesson = Math.round((ARCHIVE_BASE_PRICE * (1 - discount / 100)) / 10) * 10;

    return {
      title,
      pricePerLesson,
      totalPrice: pricePerLesson * lessons,
      discountPercent: discount || undefined,
      popular,
      details: composition(group, individual),
    };
  }),
};

const individualOffer: PayOffer = {
  slug: 'individual',
  title: 'Индивидуальные занятия',
  subtitle: 'Один на один с педагогом',
  description: `${individualIndications.intro}. Выберите количество занятий на месяц`,
  indications: individualIndications.signs,
  chooseLabel: 'Количество занятий',
  options: individualPlans.map((plan) => ({
    title: `${plan.lessons} ${lessonsWord(plan.lessons)}`,
    pricePerLesson: plan.pricePerLesson,
    totalPrice: plan.totalPrice,
    popular: plan.popular,
    details: composition(0, plan.lessons),
  })),
};

const diagnosticPrimary: PayOffer = {
  slug: 'diagnostika',
  title: 'Первичная диагностика',
  description:
    'Полное обследование чтения и письма, определение механизмов нарушения, консультация и индивидуальный план коррекции дислексии, дисграфии и дизорфографии',
  options: [
    {
      title: 'Первичная диагностика',
      totalPrice: DIAGNOSTIC_PRIMARY.price,
      oldPrice: DIAGNOSTIC_PRIMARY.oldPrice,
      details: [
        { icon: 'Clock', color: 'text-gray-400', text: '90–120 минут' },
        { icon: 'Video', color: 'text-blue-500', text: 'Онлайн, с логопедом-нейропсихологом' },
        { icon: 'FileText', color: 'text-green-500', text: 'Заключение и план коррекции' },
      ],
    },
  ],
};

const diagnosticInterim: PayOffer = {
  slug: 'diagnostika-promezhutochnaya',
  title: 'Промежуточная диагностика',
  description:
    'Контроль динамики в процессе обучения: что уже изменилось, что закрепилось и куда двигаться дальше',
  options: [
    {
      title: 'Промежуточная диагностика',
      totalPrice: DIAGNOSTIC_INTERIM.price,
      details: [
        { icon: 'Clock', color: 'text-gray-400', text: '40–50 минут' },
        { icon: 'Video', color: 'text-blue-500', text: 'Онлайн, с педагогом ребёнка' },
        { icon: 'TrendingUp', color: 'text-green-500', text: 'Отчёт о динамике' },
      ],
    },
  ],
};

export const payOffers: PayOffer[] = [
  diagnosticPrimary,
  diagnosticInterim,
  ...subscriptionOffers,
  individualOffer,
  archiveOffer,
];

export const getPayOffer = (slug?: string) =>
  payOffers.find((offer) => offer.slug === slug);
