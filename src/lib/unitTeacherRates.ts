/**
 * Точные ставки педагогов для отчёта «Маржинальность урока».
 *
 * Раньше в расчёте стояла ОДНА ставка на форму занятия (650 ₽ для всех).
 * Это допущение завышало или занижало маржу: у педагогов ставки разные —
 * от базовых 300 ₽ до 650 ₽ в зависимости от среднего балла супервизий.
 *
 * Здесь мы берём ставку КАЖДОГО педагога за тот период, в который попадает
 * месяц отчёта (та же логика, что на экране «Супервизии → Ставки»):
 *   ручная правка → зафиксированная в прошлом периоде → расчёт по баллам.
 *
 * Дальше считаем СРЕДНЕВЗВЕШЕННУЮ ставку по фактическому числу занятий
 * месяца: педагог, проведший 63 урока, влияет на среднюю сильнее того,
 * кто провёл 2. Простое среднее ставок дало бы неверную картину.
 *
 * Значение ставки трактуем как оплату ЗА ЗАНЯТИЕ ЦЕЛИКОМ — так же, как
 * работал отчёт до уточнения, чтобы цифры остались сопоставимыми.
 */
import type { Supervision } from './supervisionsApi';
import type { TeacherRate } from './teacherRatesApi';
import type { UnitFactTeacher } from './unitMarginApi';
import type { LessonForm } from './supervisionChecklist';
import { BASE_RATE, rateFromScore } from './supervisionRate';
import { rateKey } from './teacherRatesApi';
import {
  ReportPeriod, currentPeriod, periodsRange, previousPeriod,
} from './supervisionPeriods';

/** Ставка одного педагога по одной форме занятий за месяц отчёта. */
export interface TeacherRateRow {
  teacherId: number;
  name: string;
  form: LessonForm;
  /** Сколько занятий этой формы он провёл в месяце. */
  lessons: number;
  /** Ставка за занятие, ₽. */
  rate: number;
  /** Откуда взялась ставка — показываем, чтобы цифру можно было проверить. */
  source: 'manual' | 'locked' | 'score' | 'base';
  /** Средний балл, по которому посчитана ставка (если считали по баллам). */
  avgScore: number | null;
}

/** Итог по одной форме занятий: средневзвешенная ставка и её разбор. */
export interface WeightedRate {
  /** Средневзвешенная ставка за занятие, ₽. */
  rate: number;
  /** Всего занятий этой формы в месяце. */
  lessons: number;
  /** Занятий, для которых ставку нашли по супервизиям. */
  matchedLessons: number;
  /** Строки-участники расчёта, по убыванию числа занятий. */
  rows: TeacherRateRow[];
  /** Ставка, применённая к занятиям без своей ставки (запасная). */
  fallbackRate: number;
}

/** Период отчётности, в который попадает месяц «YYYY-MM». */
export function periodForMonth(month: string): ReportPeriod {
  const [y, m] = String(month || '').split('-').map(Number);
  if (!y || !m) return currentPeriod(new Date());
  // 15-е число — заведомо внутри месяца, часовые пояса не мешают
  return currentPeriod(new Date(y, m - 1, 15));
}

/**
 * Имя педагога в каноничный вид для сопоставления.
 *
 * В CRM педагог записан как «Екатерина Канкулова», в супервизиях —
 * «Канкулова Екатерина», и ID у них РАЗНЫЕ (17 против 20). Поэтому
 * сравниваем по набору слов имени, а не по строке и не по id.
 */
const nameKey = (raw: string): string =>
  (raw || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((w) => w.length > 1)
    .sort()
    .join(' ');

/**
 * Ставка педагога за период по данным супервизий.
 * Повторяет логику экрана «Супервизии → Ставки», чтобы цифры совпадали.
 */
function rateForTeacher(
  teacherId: number,
  form: LessonForm,
  period: ReportPeriod,
  supervisions: Supervision[],
  savedByKey: Map<string, TeacherRate>,
): { rate: number; source: TeacherRateRow['source']; avgScore: number | null } {
  const prev = previousPeriod(period);
  const inPeriod = (s: Supervision, p: ReportPeriod) =>
    !!s.supervision_date && s.supervision_date >= p.from && s.supervision_date <= p.to;

  const avgOf = (list: Supervision[]) =>
    list.length === 0
      ? null
      : Math.round((list.reduce((s, i) => s + i.total_score, 0) / list.length) * 10) / 10;

  const mine = supervisions.filter(
    (s) => s.teacher_id === teacherId && s.lesson_form === form,
  );
  const prevAvg = avgOf(mine.filter((s) => inPeriod(s, prev)));

  const saved = savedByKey.get(rateKey(teacherId, form, period.key));
  const savedPrev = savedByKey.get(rateKey(teacherId, form, prev.key));

  // 1. Ручная правка руководителя — она главнее любого расчёта
  if (saved?.current_rate != null) {
    return { rate: saved.current_rate, source: 'manual', avgScore: prevAvg };
  }
  // 2. Ставка, зафиксированная в прошлом периоде «на будущее»
  if (savedPrev?.planned_locked && savedPrev.planned_rate != null) {
    return { rate: savedPrev.planned_rate, source: 'locked', avgScore: prevAvg };
  }
  // 3. Расчёт по среднему баллу супервизий ПРОШЛОГО периода
  if (prevAvg !== null) {
    return { rate: rateFromScore(form, prevAvg).rate, source: 'score', avgScore: prevAvg };
  }
  // 4. Супервизий не было — базовая ставка
  return { rate: BASE_RATE, source: 'base', avgScore: null };
}

/**
 * Средневзвешенная ставка по форме занятий за месяц.
 *
 * @param teachers   разрез CRM: кто сколько занятий провёл
 * @param form       форма занятий
 * @param month      месяц отчёта, «YYYY-MM»
 * @param fallback   ставка для занятий, чьего педагога нет в супервизиях
 */
export function weightedRate(
  teachers: UnitFactTeacher[],
  form: LessonForm,
  month: string,
  supervisions: Supervision[],
  rates: TeacherRate[],
  fallback: number,
): WeightedRate {
  const period = periodForMonth(month);

  const savedByKey = new Map<string, TeacherRate>();
  rates.forEach((r) => savedByKey.set(rateKey(r.teacher_id, r.lesson_form, r.period_key), r));

  // Сопоставляем педагога CRM с супервизиями ПО ИМЕНИ: идентификаторы
  // в двух системах разные (Канкулова — 17 в CRM и 20 в супервизиях).
  const supByName = new Map<string, number>();
  supervisions.forEach((s) => {
    const k = nameKey(s.teacher_name);
    if (k) supByName.set(k, s.teacher_id);
  });
  rates.forEach((r) => {
    const k = nameKey(r.teacher_name);
    if (k && !supByName.has(k)) supByName.set(k, r.teacher_id);
  });

  const rows: TeacherRateRow[] = [];
  let weighted = 0;
  let lessons = 0;
  let matchedLessons = 0;

  teachers.forEach((t) => {
    const n = form === 'group' ? t.group_lessons : t.individual_lessons;
    if (!n) return;
    lessons += n;

    const supId = supByName.get(nameKey(t.name));
    if (supId === undefined) {
      // Педагога нет в супервизиях (например, руководитель подменил урок):
      // считаем по запасной ставке, но показываем это отдельной строкой.
      rows.push({
        teacherId: t.teacher_id, name: t.name, form, lessons: n,
        rate: fallback, source: 'base', avgScore: null,
      });
      weighted += fallback * n;
      return;
    }

    const { rate, source, avgScore } = rateForTeacher(
      supId, form, period, supervisions, savedByKey,
    );
    rows.push({ teacherId: t.teacher_id, name: t.name, form, lessons: n, rate, source, avgScore });
    weighted += rate * n;
    matchedLessons += n;
  });

  rows.sort((a, b) => b.lessons - a.lessons);

  return {
    rate: lessons > 0 ? Math.round((weighted / lessons) * 100) / 100 : fallback,
    lessons,
    matchedLessons,
    rows,
    fallbackRate: fallback,
  };
}

/** Период, за который взяты ставки — подпись для интерфейса. */
export const periodLabelForMonth = (month: string) => periodForMonth(month).label;

export { periodsRange };
