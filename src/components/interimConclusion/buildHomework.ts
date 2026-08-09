/**
 * Автоматический отчёт о выполнении домашних заданий.
 *
 * Источник — отметки педагогов в разделе «Контроль ДЗ»:
 *   зелёный  — выполнено отлично,
 *   жёлтый   — выполнено хорошо,
 *   красный  — не выполнено / выполнено плохо.
 *
 * Занятия БЕЗ отметки в расчёт не берём: пустая клетка означает,
 * что педагог не заполнил контроль, и ставить это в вину ученику нельзя.
 *
 * Отчёт состоит из двух частей:
 *   1) как обстоят дела за всё время наблюдений,
 *   2) что изменилось за последние 3 месяца по сравнению с более ранним периодом
 *      (сравнение появляется, только когда данных хватает на оба отрезка).
 */

export type HwStatus = 'green' | 'yellow' | 'red';

export interface HwMark {
  date: string;
  status: HwStatus;
  /** Отметка стоит на общей строке сиблингов (один статус на двоих) */
  shared?: boolean;
}

interface Counts {
  green: number;
  yellow: number;
  red: number;
  total: number;
}

function count(marks: HwMark[]): Counts {
  const c: Counts = { green: 0, yellow: 0, red: 0, total: 0 };
  marks.forEach((m) => {
    if (m.status === 'green' || m.status === 'yellow' || m.status === 'red') {
      c[m.status] += 1;
      c.total += 1;
    }
  });
  return c;
}

/** Доля выполненных (зелёные + жёлтые) в процентах */
function doneShare(c: Counts): number {
  if (c.total === 0) return 0;
  return Math.round(((c.green + c.yellow) / c.total) * 100);
}

/** Доля выполненных отлично (только зелёные) */
function excellentShare(c: Counts): number {
  if (c.total === 0) return 0;
  return Math.round((c.green / c.total) * 100);
}

/**
 * Общая оценка регулярности. Пороги подобраны так, чтобы формулировка
 * звучала корректно для родителя и не занижала реальный результат.
 */
function regularityPhrase(share: number): string {
  if (share >= 90) return 'домашние задания выполняются регулярно';
  if (share >= 70) return 'домашние задания выполняются в большинстве случаев';
  if (share >= 50) return 'домашние задания выполняются примерно в половине случаев';
  if (share >= 25) return 'домашние задания выполняются нерегулярно';
  return 'домашние задания в большинстве случаев не выполняются';
}

/** Оценка качества по доле «отлично» среди выполненных */
function qualityPhrase(c: Counts): string {
  const done = c.green + c.yellow;
  if (done === 0) return '';
  const excellent = Math.round((c.green / done) * 100);
  if (excellent >= 80) return 'качество выполнения высокое';
  if (excellent >= 50) return 'качество выполнения в целом хорошее';
  if (excellent >= 20) return 'качество выполнения среднее';
  return 'выполненные задания требуют более тщательной проработки';
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

function fmtDate(iso: string): string {
  const p = (iso || '').split('-');
  if (p.length !== 3) return iso;
  const m = Number(p[1]);
  return `${Number(p[2])} ${MONTHS[m - 1] || ''}`.trim();
}

/** Сдвиг даты на N месяцев назад в формате YYYY-MM-DD */
function monthsBack(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

export function buildHomeworkReport(marks: HwMark[], examDate?: string): string {
  const valid = (marks || []).filter(
    (m) => m && m.date && (m.status === 'green' || m.status === 'yellow' || m.status === 'red'),
  );

  if (valid.length === 0) {
    return '';
  }

  const sorted = [...valid].sort((a, b) => a.date.localeCompare(b.date));
  const all = count(sorted);

  const first = sorted[0].date;
  const last = sorted[sorted.length - 1].date;

  const parts: string[] = [];

  // --- 1. За всё время наблюдений ---
  const share = doneShare(all);
  const quality = qualityPhrase(all);

  let overall =
    `За период наблюдений (с ${fmtDate(first)} по ${fmtDate(last)}) ` +
    `отмечено ${all.total} ${plural(all.total, 'занятие', 'занятия', 'занятий')} с контролем ` +
    `домашнего задания: ${regularityPhrase(share)} (${share}%)`;
  if (quality) overall += `, ${quality}`;
  overall += '.';

  const detail: string[] = [];
  if (all.green > 0) detail.push(`выполнено отлично — ${all.green}`);
  if (all.yellow > 0) detail.push(`выполнено хорошо — ${all.yellow}`);
  if (all.red > 0) detail.push(`не выполнено — ${all.red}`);
  if (detail.length > 0) overall += ` Из них: ${detail.join(', ')}.`;

  parts.push(overall);

  // --- 2. Динамика за последние 3 месяца ---
  // Точка отсчёта — дата диагностики, иначе последняя отметка.
  const anchor = examDate && examDate.length === 10 ? examDate : last;
  const cutoff = monthsBack(anchor, 3);

  const recent = sorted.filter((m) => m.date >= cutoff);
  const earlier = sorted.filter((m) => m.date < cutoff);

  if (recent.length > 0 && earlier.length > 0) {
    const r = count(recent);
    const e = count(earlier);
    const rShare = doneShare(r);
    const eShare = doneShare(e);
    const rExc = excellentShare(r);
    const eExc = excellentShare(e);

    const diffShare = rShare - eShare;
    const diffExc = rExc - eExc;

    let trend = `За последние 3 месяца регулярность выполнения ${rShare}% против ${eShare}% ранее`;
    if (Math.abs(diffShare) < 10) {
      trend += ' — существенных изменений нет';
    } else if (diffShare > 0) {
      trend += ` — регулярность выросла на ${diffShare}%`;
    } else {
      trend += ` — регулярность снизилась на ${Math.abs(diffShare)}%`;
    }
    trend += '.';

    if (Math.abs(diffExc) >= 10) {
      trend +=
        diffExc > 0
          ? ` Качество выполнения улучшилось: доля заданий, выполненных отлично, выросла с ${eExc}% до ${rExc}%.`
          : ` Качество выполнения снизилось: доля заданий, выполненных отлично, уменьшилась с ${eExc}% до ${rExc}%.`;
    }

    parts.push(trend);
  }
  // Если данных на сравнение не хватает — просто ничего об этом не пишем:
  // оговорка про «недоступно» в заключении для родителя лишняя.

  // Отметка на общей строке сиблингов — предупреждаем логопеда
  if (sorted.some((m) => m.shared)) {
    parts.push(
      'Примечание: в контроле ДЗ занятия отмечены общей строкой с братом/сестрой, ' +
        'поэтому статистика отражает выполнение заданий обоими детьми.',
    );
  }

  return parts.join('\n\n');
}