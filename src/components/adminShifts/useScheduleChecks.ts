import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScheduleFinding,
  UpcomingLesson,
  fetchScheduleChecks,
} from '@/lib/adminShiftsApi';
import { SCHEDULE_CHECKS, ScheduleCheckKey } from '@/lib/shiftChecklist';
import { StudentRow, fetchStudents } from '@/lib/studentsApi';
import { payLinkForTariff } from '@/lib/payLinks';
import { MarkState } from './useShiftChecklist';

/** Ключ отметки по одной находке: «m2a:425» — подпункт и id из CRM */
export const findingKey = (check: ScheduleCheckKey, id: number | string) => `${check}:${id}`;

/** Группа проверок = пункт чек-листа */
export type CheckGroup = 'yesterday' | 'schedule' | 'balance';

/** Пункт чек-листа, к которому относится группа проверок */
const GROUP_ITEM_KEY: Record<CheckGroup, string> = {
  yesterday: 'm1',
  schedule: 'm2',
  balance: 'm3',
};

export interface ScheduleCheckState {
  key: ScheduleCheckKey;
  letter: string;
  title: string;
  empty: string;
  group: CheckGroup;
  action?: string;
  payLink?: boolean;
  findings: ScheduleFinding[];
  /** Ничего не нашли — подпункт закрыт автоматически */
  clean: boolean;
  /** Все находки разобраны (или находок нет) */
  done: boolean;
}

interface CachedChecks {
  checks: Record<string, ScheduleFinding[]>;
  yesterday: string;
  upcoming: UpcomingLesson[];
}

const cacheKey = (date: string) => `schedule_checks_${date}`;

/** Результат прошлой проверки за эту же дату — чтобы не ходить в CRM при каждом переходе по меню */
const readCache = (date: string): CachedChecks | null => {
  try {
    const raw = sessionStorage.getItem(cacheKey(date));
    return raw ? (JSON.parse(raw) as CachedChecks) : null;
  } catch {
    return null;
  }
};

/** Ученик действующий — архив и бросивших не дёргаем */
const isActiveStudent = (s: StudentRow) => s.status_id !== 3 && s.status_id !== 2;

/** Находка пункта 3: ученик, его абонемент и ссылка на оплату */
const balanceFinding = (s: StudentRow, lesson?: UpcomingLesson): ScheduleFinding => {
  const link = payLinkForTariff(s.tariff);
  return {
    // Ключ по карточке CRM: у сиблингов id строки разные, а абонемент общий
    id: s.crm_customer_id || s.id,
    name: s.name,
    tariff: s.tariff?.short_name || s.tariff?.name,
    paid_left: s.tariff?.paid_lessons_left,
    ...(lesson ? { time: `${fmtDay(lesson.date)} ${lesson.time}`.trim() } : {}),
    ...(lesson ? { teacher: lesson.teacher } : {}),
    ...(link ? { payUrl: link.url, payLabel: link.label } : {}),
  };
};

/** «2026-09-25» → «25.09» */
const fmtDay = (d: string) => {
  const p = String(d || '').split('-');
  return p.length === 3 ? `${p[2]}.${p[1]}` : '';
};

/**
 * Проверки по CRM для пунктов 1, 2 и 3 чек-листа.
 * В CRM ходим ТОЛЬКО по кнопке: запрос тяжёлый, дёргать его на каждом
 * открытии админки нельзя. Результат держим в сессии до конца дня.
 * Пустой подпункт закрываем сами — админу нечего отмечать.
 */
export function useScheduleChecks(
  date: string,
  marks: Record<string, MarkState>,
  setMark: (key: string, p: MarkState) => void,
  /** Находки, закрытые в прошлые дни, — повторно не показываем */
  handledBefore: string[] = [],
) {
  const [checks, setChecks] = useState<Record<string, ScheduleFinding[]> | null>(null);
  const [yesterday, setYesterday] = useState('');
  const [upcoming, setUpcoming] = useState<UpcomingLesson[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  // Подхватываем прошлый результат за эту дату, если он есть в сессии
  useEffect(() => {
    const cached = readCache(date);
    setChecks(cached?.checks ?? null);
    setYesterday(cached?.yesterday ?? '');
    setUpcoming(cached?.upcoming ?? []);
    setFailed(false);
    setLoading(false);
  }, [date]);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    // Список учеников нужен пункту 3: остаток занятий считается там же,
    // где и в разделе «Список учеников», — дважды одну логику не пишем.
    const [data, list] = await Promise.all([
      fetchScheduleChecks(date),
      fetchStudents(true).catch(() => [] as StudentRow[]),
    ]);
    setStudents(list);
    if (!data) {
      setFailed(true);
    } else {
      setChecks(data.checks);
      setYesterday(data.yesterday);
      setUpcoming(data.upcoming);
      try {
        sessionStorage.setItem(
          cacheKey(date),
          JSON.stringify({
            checks: data.checks,
            yesterday: data.yesterday,
            upcoming: data.upcoming,
          }),
        );
      } catch {
        /* сессия переполнена — не страшно, просто не кешируем */
      }
    }
    setLoading(false);
  }, [date]);

  /** Пункт 3: кому остался последний урок и у кого занятия кончились */
  const balanceFindings = useMemo(() => {
    const lastOne: ScheduleFinding[] = [];
    const runOut: ScheduleFinding[] = [];
    if (students.length === 0) return { m3a: lastOne, m3b: runOut };

    // Ближайший урок ученика — ищем по карточке CRM
    const byCustomer = new Map<number, UpcomingLesson>();
    upcoming.forEach((l) => {
      const prev = byCustomer.get(l.customer_id);
      if (!prev || `${l.date}${l.time}` < `${prev.date}${prev.time}`) {
        byCustomer.set(l.customer_id, l);
      }
    });

    const seen = new Set<number>();
    students.filter(isActiveStudent).forEach((s) => {
      const t = s.tariff;
      if (!t) return;
      // Сиблинги делят одну карточку и один абонемент — берём строку один раз
      const cid = s.crm_customer_id || s.id;
      if (seen.has(cid)) return;
      const left = t.paid_lessons_left;

      if (left === 1) {
        seen.add(cid);
        lastOne.push(balanceFinding(s, byCustomer.get(cid)));
        return;
      }
      // Занятия кончились, но урок уже завтра-послезавтра — напоминаем
      if (left <= 0 && byCustomer.has(cid)) {
        seen.add(cid);
        runOut.push(balanceFinding(s, byCustomer.get(cid)));
      }
    });

    const byName = (a: ScheduleFinding, b: ScheduleFinding) =>
      (a.name || '').localeCompare(b.name || '', 'ru');
    return { m3a: lastOne.sort(byName), m3b: runOut.sort(byName) };
  }, [students, upcoming]);

  const sections = useMemo<ScheduleCheckState[]>(() => {
    if (!checks) return [];
    const handled = new Set(handledBefore);
    const all: Record<string, ScheduleFinding[]> = { ...checks, ...balanceFindings };

    return SCHEDULE_CHECKS.map((meta) => {
      let findings = all[meta.key] || [];
      // Напоминание об оплате отправляют один раз: ученика, по которому
      // галку уже поставили в прошлые дни, сегодня не показываем.
      if (meta.group === 'balance') {
        findings = findings.filter((f) => !handled.has(findingKey(meta.key, f.id)));
      }
      const done = findings.every((f) => marks[findingKey(meta.key, f.id)]?.done);
      return { ...meta, findings, clean: findings.length === 0, done };
    });
  }, [checks, marks, balanceFindings, handledBefore]);

  /** Проверка уже сделана — есть данные из CRM */
  const checked = checks !== null;

  /** Подпункты конкретного пункта чек-листа */
  const sectionsFor = useCallback(
    (group: CheckGroup) => sections.filter((s) => s.group === group),
    [sections],
  );

  /**
   * Пункт закрыт, когда разобраны все его подпункты.
   * Пока проверку не запускали, показываем отметку, сохранённую в базе.
   */
  const groupDone = useCallback(
    (group: CheckGroup) => {
      const list = sections.filter((s) => s.group === group);
      if (!checked) return !!marks[GROUP_ITEM_KEY[group]]?.done;
      return list.length > 0 && list.every((s) => s.done);
    },
    [sections, checked, marks],
  );

  // Держим галочки пунктов 1 и 2 в согласии с подпунктами:
  // иначе прогресс дня врал бы при разобранных находках.
  // До ручной проверки в CRM ничего не трогаем — отметка остаётся за админом.
  useEffect(() => {
    if (loading || !checked || sections.length === 0) return;
    (['yesterday', 'schedule', 'balance'] as CheckGroup[]).forEach((group) => {
      const list = sections.filter((s) => s.group === group);
      if (list.length === 0) return;
      const itemKey = GROUP_ITEM_KEY[group];
      const allDone = list.every((s) => s.done);
      const cur = marks[itemKey];
      if (!!cur?.done === allDone) return;
      setMark(itemKey, { done: allDone, comment: cur?.comment || '' });
    });
  }, [sections, loading, checked, marks, setMark]);

  return { sections, sectionsFor, groupDone, yesterday, loading, failed, checked, reload: load };
}