import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScheduleFinding, fetchScheduleChecks } from '@/lib/adminShiftsApi';
import { SCHEDULE_CHECKS, ScheduleCheckKey } from '@/lib/shiftChecklist';
import { MarkState } from './useShiftChecklist';

/** Ключ отметки по одной находке: «m2a:425» — подпункт и id из CRM */
export const findingKey = (check: ScheduleCheckKey, id: number | string) => `${check}:${id}`;

/** Группа проверок = пункт чек-листа: вчерашний день или расписание на сегодня */
export type CheckGroup = 'yesterday' | 'schedule';

/** Пункт чек-листа, к которому относится группа проверок */
const GROUP_ITEM_KEY: Record<CheckGroup, string> = {
  yesterday: 'm1',
  schedule: 'm2',
};

export interface ScheduleCheckState {
  key: ScheduleCheckKey;
  letter: string;
  title: string;
  empty: string;
  group: CheckGroup;
  findings: ScheduleFinding[];
  /** Ничего не нашли — подпункт закрыт автоматически */
  clean: boolean;
  /** Все находки разобраны (или находок нет) */
  done: boolean;
}

interface CachedChecks {
  checks: Record<string, ScheduleFinding[]>;
  yesterday: string;
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

/**
 * Проверки по CRM для пунктов 1 и 2 чек-листа.
 * В CRM ходим ТОЛЬКО по кнопке: запрос тяжёлый, дёргать его на каждом
 * открытии админки нельзя. Результат держим в сессии до конца дня.
 * Пустой подпункт закрываем сами — админу нечего отмечать.
 */
export function useScheduleChecks(
  date: string,
  marks: Record<string, MarkState>,
  setMark: (key: string, p: MarkState) => void,
) {
  const [checks, setChecks] = useState<Record<string, ScheduleFinding[]> | null>(null);
  const [yesterday, setYesterday] = useState('');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  // Подхватываем прошлый результат за эту дату, если он есть в сессии
  useEffect(() => {
    const cached = readCache(date);
    setChecks(cached?.checks ?? null);
    setYesterday(cached?.yesterday ?? '');
    setFailed(false);
    setLoading(false);
  }, [date]);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const data = await fetchScheduleChecks(date);
    if (!data) {
      setFailed(true);
    } else {
      setChecks(data.checks);
      setYesterday(data.yesterday);
      try {
        sessionStorage.setItem(
          cacheKey(date),
          JSON.stringify({ checks: data.checks, yesterday: data.yesterday }),
        );
      } catch {
        /* сессия переполнена — не страшно, просто не кешируем */
      }
    }
    setLoading(false);
  }, [date]);

  const sections = useMemo<ScheduleCheckState[]>(() => {
    if (!checks) return [];
    return SCHEDULE_CHECKS.map((meta) => {
      const findings = checks[meta.key] || [];
      const done = findings.every((f) => marks[findingKey(meta.key, f.id)]?.done);
      return { ...meta, findings, clean: findings.length === 0, done };
    });
  }, [checks, marks]);

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
    (['yesterday', 'schedule'] as CheckGroup[]).forEach((group) => {
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
