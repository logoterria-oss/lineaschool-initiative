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

/**
 * Автопроверки расписания для пункта 1.
 * Пустой подпункт закрываем сами — админу нечего отмечать.
 */
export function useScheduleChecks(
  date: string,
  marks: Record<string, MarkState>,
  setMark: (key: string, p: MarkState) => void,
) {
  const [checks, setChecks] = useState<Record<string, ScheduleFinding[]> | null>(null);
  const [yesterday, setYesterday] = useState('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const data = await fetchScheduleChecks(date);
    if (!data) {
      setFailed(true);
      setChecks(null);
    } else {
      setChecks(data.checks);
      setYesterday(data.yesterday);
    }
    setLoading(false);
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const sections = useMemo<ScheduleCheckState[]>(() => {
    if (!checks) return [];
    return SCHEDULE_CHECKS.map((meta) => {
      const findings = checks[meta.key] || [];
      const done = findings.every((f) => marks[findingKey(meta.key, f.id)]?.done);
      return { ...meta, findings, clean: findings.length === 0, done };
    });
  }, [checks, marks]);

  /** Пункт 1 целиком — когда разобраны все четыре подпункта */
  const allDone = sections.length > 0 && sections.every((s) => s.done);

  // Держим общую галочку пункта 1 в согласии с подпунктами:
  // иначе прогресс дня врал бы при разобранных находках.
  useEffect(() => {
    if (loading || failed || sections.length === 0) return;
    const cur = marks.m1;
    if (!!cur?.done === allDone) return;
    setMark('m1', { done: allDone, comment: cur?.comment || '' });
  }, [allDone, loading, failed, sections.length, marks, setMark]);

  return { sections, yesterday, loading, failed, allDone, reload: load };
}
