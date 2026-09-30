/**
 * Цена первичной диагностики — единственный источник правды для всего проекта.
 *
 * Цену меняем не «руками в день Х», а расписанием: указываем момент, с которого
 * действует новая стоимость, и в эту минуту она сама встаёт везде — на лендинге,
 * на страницах оплаты, в тарифах и в ручном вводе оплат. Пересчёт идёт по
 * московскому времени: школа живёт по Москве, часы на компьютере родителя
 * (Владивосток, Калининград) на цену не влияют.
 *
 * Чтобы назначить новую цену: добавьте запись в PRIMARY_PRICE_SCHEDULE с датой
 * в формате ISO с указанием московской зоны (+03:00). Записи могут идти в любом
 * порядке — действует последняя из уже наступивших.
 */

type PricePoint = {
  /** Момент, с которого действует цена (московское время, +03:00). */
  from: string;
  price: number;
  /** Зачёркнутая цена «без акции». */
  oldPrice: number;
};

/** Базовая цена — действует до первой записи расписания. */
const PRIMARY_PRICE_BASE: Omit<PricePoint, 'from'> = { price: 1490, oldPrice: 4500 };

const PRIMARY_PRICE_SCHEDULE: PricePoint[] = [
  // С 1 октября 2026, 00:00 по Москве
  { from: '2026-10-01T00:00:00+03:00', price: 2190, oldPrice: 4500 },
];

const schedule = [...PRIMARY_PRICE_SCHEDULE].sort(
  (a, b) => Date.parse(a.from) - Date.parse(b.from),
);

/** Цена первичной диагностики на указанный момент (по умолчанию — сейчас). */
export const getPrimaryDiagnosticPrice = (at: Date = new Date()) => {
  const now = at.getTime();
  const active = schedule.filter((point) => Date.parse(point.from) <= now).pop();
  const { price, oldPrice } = active ?? PRIMARY_PRICE_BASE;
  return { price, oldPrice };
};

/**
 * Ближайшее изменение цены — по нему компоненты понимают, через сколько
 * миллисекунд перерисоваться, чтобы не ждать перезагрузки страницы.
 */
export const getNextPriceChange = (at: Date = new Date()) => {
  const now = at.getTime();
  const next = schedule.find((point) => Date.parse(point.from) > now);
  return next ? Date.parse(next.from) - now : null;
};

/** Промежуточная диагностика — контроль динамики в процессе обучения. */
export const INTERIM_DIAGNOSTIC_PRICE = 2000;
