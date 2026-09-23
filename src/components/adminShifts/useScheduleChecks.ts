import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScheduleFinding, fetchScheduleChecks } from '@/lib/adminShiftsApi';
import { SCHEDULE_CHECKS, ScheduleCheckKey } from '@/lib/shiftChecklist';
import { MarkState } from './useShiftChecklist';

/** Ключ отметки по одной находке: «m1b:425» — подпункт и id из CRM */
export const findingKey = (check: ScheduleCheckKey, id: number | string) => `${check}:${id}`;

export interface ScheduleCheckState {
  key: ScheduleCheckKey;
  letter: string;
  title: string;
  empty: string;
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
 * Автопроверки расписания для пункта 1.
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

  // Пункт 1 целиком — когда разобраны все четыре подпункта.
  // Пока проверку не запускали, показываем отметку, сохранённую в базе.
  const allDone = checked
    ? sections.length > 0 && sections.every((s) => s.done)
    : !!marks.m1?.done;

  // Держим общую галочку пункта 1 в согласии с подпунктами:
  // иначе прогресс дня врал бы при разобранных находках.
  // До ручной проверки в CRM ничего не трогаем — отметка остаётся за админом.
  useEffect(() => {
    if (loading || !checked || sections.length === 0) return;
    const cur = marks.m1;
    if (!!cur?.done === allDone) return;
    setMark('m1', { done: allDone, comment: cur?.comment || '' });
  }, [allDone, loading, checked, sections.length, marks, setMark]);

  return { sections, yesterday, loading, failed, checked, allDone, reload: load };
}