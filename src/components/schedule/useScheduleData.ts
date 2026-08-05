import { useState, useRef } from 'react';
import {
  S20_URL,
  TEACHER_SHORT,
  RawLesson,
  RawTeacher,
  Customer,
  fmtDate,
  addDays,
  fmtRu,
  buildGroupRowsFromLessons,
  calcAge,
  formatStudentName,
  manualAge,
  shouldForceManualAge,
} from './types';
import {
  ScheduleType,
  IndDay,
  LOGO_URL,
  loadImageAsDataUrl,
  STABLE_WEEKS,
  MAX_START_OFFSET,
  WEEKS_TO_LOAD,
  generatePdf,
} from './pdfExportUtils';

export interface IndStableDay {
  dayOffset: number;
  items: { time: string; teachers: { name: string; fromDate: Date | null }[] }[];
}

export interface GroupStableDay {
  dayOffset: number;
  items: { time: string; teacher: string; free: number; ageLabel: string; fromDate: Date | null }[];
}

// 'regular' — регулярное расписание: окно предлагаем, только если оно стабильно
//             (свободно несколько недель подряд).
// 'once'    — разовый перенос: смотрим ТОЛЬКО выбранную неделю, без проверки
//             стабильности и без пометок «с такого-то числа».
export type PdfMode = 'regular' | 'once';

export const useScheduleData = (mode: PdfMode = 'regular') => {
  const isOnce = mode === 'once';
  // В разовом режиме грузим одну неделю и не сдвигаем старт вперёд
  const weeksToLoad = isOnce ? 1 : WEEKS_TO_LOAD;
  const maxStartOffset = isOnce ? 0 : MAX_START_OFFSET;

  // Регулярное расписание: раньше завтрашнего дня начинать нельзя (сегодня —
  // день диагностики, и это ломало бы логику стабильных окон).
  // Разовый перенос: отсчёт идёт от СЕГОДНЯ — неделя это «сегодня + 6 дней».
  const minDate = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (!isOnce) d.setDate(d.getDate() + 1);
    return d;
  })();

  // Дата начала окна: регулярное — завтра, разовый перенос — сегодня
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (!isOnce) d.setDate(d.getDate() + 1);
    return d;
  });
  const [type, setType] = useState<ScheduleType>('both');
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  // По одному набору данных на каждую загружаемую неделю (индекс 0 = неделя старта)
  const [indWeeks, setIndWeeks] = useState<IndDay[][] | null>(null);
  const [groupWeeks, setGroupWeeks] = useState<ReturnType<typeof buildGroupRowsFromLessons>[] | null>(null);
  const [customers, setCustomers] = useState<Record<number, Customer>>({});
  const [logoData, setLogoData] = useState<string>('');
  const [ready, setReady] = useState(false);

  const onDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const d = new Date(`${val}T00:00:00`);
    d.setHours(0, 0, 0, 0);
    // Не позволяем выбрать сегодняшний день или прошедшую дату
    setStartDate(d < minDate ? minDate : d);
    setReady(false);
  };

  const loadData = async () => {
    setBuilding(true);
    setError('');
    setReady(false);
    try {
      if (!logoData) {
        try {
          const data = await loadImageAsDataUrl(LOGO_URL);
          setLogoData(data);
        } catch {
          /* не критично — PDF без логотипа */
        }
      }

      // «Неделя» здесь — скользящее окно из 7 дней от даты старта:
      // период 0 = startDate..startDate+6, период 1 = startDate+7..+13 и т.д.
      const weekStarts = Array.from({ length: weeksToLoad }, (_, w) => addDays(startDate, w * 7));

      if (type === 'individual' || type === 'both') {
        const weeks: IndDay[][] = [];
        for (const ws of weekStarts) {
          const resp = await fetch(`${S20_URL}?mode=ind_week&date_from=${fmtDate(ws)}&date_to=${fmtDate(addDays(ws, 6))}`);
          const data = await resp.json();
          if (data.error) throw new Error(data.error);
          weeks.push(Array.isArray(data.days) ? data.days : []);
        }
        setIndWeeks(weeks);
      } else {
        setIndWeeks(null);
      }

      if (type === 'groups' || type === 'both') {
        let teachers: RawTeacher[] = [];
        try {
          const tresp = await fetch(`${S20_URL}?mode=teachers`);
          const tdata = await tresp.json();
          if (Array.isArray(tdata.teachers)) teachers = tdata.teachers;
          else if (Array.isArray(tdata.items)) teachers = tdata.items;
        } catch {
          /* не критично */
        }

        const weeks: ReturnType<typeof buildGroupRowsFromLessons>[] = [];
        for (const ws of weekStarts) {
          const resp = await fetch(`${S20_URL}?mode=lessons&date_from=${fmtDate(ws)}&date_to=${fmtDate(addDays(ws, 6))}`);
          const data = await resp.json();
          if (data.error) throw new Error(data.error);
          const lessons: RawLesson[] = Array.isArray(data.lessons) ? data.lessons : [];
          weeks.push(buildGroupRowsFromLessons(lessons, teachers, ws));
        }
        setGroupWeeks(weeks);

        try {
          const cresp = await fetch(`${S20_URL}?mode=customers`);
          const cdata = await cresp.json();
          const items: Customer[] = Array.isArray(cdata.customers) ? cdata.customers : [];
          const map: Record<number, Customer> = {};
          for (const c of items) {
            if (c && c.id != null) map[c.id] = c;
          }
          setCustomers(map);
        } catch {
          /* не критично — без возраста не будет пометки */
        }
      } else {
        setGroupWeeks(null);
        setCustomers({});
      }

      setReady(true);
    } catch {
      setError('Не удалось загрузить данные расписания');
    } finally {
      setBuilding(false);
    }
  };

  const downloadPdf = async () => {
    if (!printRef.current) return;
    setBuilding(true);
    try {
      if (!logoData) {
        try {
          const data = await loadImageAsDataUrl(LOGO_URL);
          setLogoData(data);
          await new Promise((r) => setTimeout(r, 100));
        } catch {
          /* не критично */
        }
      }
      await generatePdf(printRef.current, startDate, null);
    } catch {
      setError('Не удалось сформировать PDF');
    } finally {
      setBuilding(false);
    }
  };

  // dayOffset (0..6) — смещение дня от даты старта (день 0 = startDate).
  // Календарный день недели этого дня (0=ПН..6=ВС) — для сортировки ПН→ВС.
  const weekdayOf = (dayOffset: number): number => {
    const d = addDays(startDate, dayOffset).getDay(); // 0=ВС..6=СБ
    return d === 0 ? 6 : d - 1;
  };

  // Реальная дата дня dayOffset в периоде с индексом period
  const dateForSlot = (period: number, dayOffset: number): Date =>
    addDays(startDate, period * 7 + dayOffset);

  // ── Индивидуальные: стабильные окна ──────────────────────────────────────────
  // dayOffset слота внутри периода period: из даты дня минус начало периода
  const indDayOffset = (period: number, isoDate: string): number => {
    const periodStart = addDays(startDate, period * 7);
    const dd = new Date(`${isoDate}T00:00:00`);
    return Math.round((dd.getTime() - periodStart.getTime()) / 86400000);
  };

  // Свободно ли индивид. окно (dayOffset, time, teacherId) в периоде period
  const isIndFree = (period: number, dayOffset: number, time: string, teacherId: number): boolean => {
    const week = indWeeks?.[period];
    if (!week) return false;
    for (const day of week) {
      if (indDayOffset(period, day.date) !== dayOffset) continue;
      if (day.slots.some((s) => s.time_from === time && s.teacher_id === teacherId && !s.busy)) {
        return true;
      }
    }
    return false;
  };

  // Стабильно ли окно STABLE_WEEKS периодов подряд, начиная с периода startPeriod.
  // В режиме разового переноса достаточно, чтобы окно было свободно в самом периоде.
  const isIndStable = (startPeriod: number, dayOffset: number, time: string, teacherId: number): boolean => {
    if (isOnce) return isIndFree(startPeriod, dayOffset, time, teacherId);
    for (let k = 0; k < STABLE_WEEKS; k++) {
      if (!isIndFree(startPeriod + k, dayOffset, time, teacherId)) return false;
    }
    return true;
  };

  const buildIndStableDays = (): IndStableDay[] => {
    const result: IndStableDay[] = [];
    if (!indWeeks || indWeeks.length === 0) return result;

    // Кандидаты окон — из периодов 0..maxStartOffset
    const seen = new Set<string>();
    const candidates: { dayOffset: number; time: string; teacherId: number; teacherName: string }[] = [];
    for (let period = 0; period <= maxStartOffset; period++) {
      const week = indWeeks[period];
      if (!week) continue;
      for (const day of week) {
        const dayOffset = indDayOffset(period, day.date);
        if (dayOffset < 0 || dayOffset > 6) continue;
        for (const s of day.slots) {
          if (s.busy) continue;
          const key = `${dayOffset}__${s.time_from}__${s.teacher_id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          candidates.push({
            dayOffset,
            time: s.time_from,
            teacherId: s.teacher_id,
            teacherName: TEACHER_SHORT[s.teacher_id] || s.teacher_name,
          });
        }
      }
    }

    const byDay: Record<number, Record<string, { name: string; fromDate: Date | null }[]>> = {};
    for (const c of candidates) {
      // Ищем первый период (0..maxStartOffset), с которого окно стабильно
      let startPeriod = -1;
      for (let p = 0; p <= maxStartOffset; p++) {
        if (isIndStable(p, c.dayOffset, c.time, c.teacherId)) {
          startPeriod = p;
          break;
        }
      }
      if (startPeriod === -1) continue; // нестабильно — не предлагаем

      // Дату «с …» показываем, только если окна нет на текущей неделе (период 0)
      const fromDate = startPeriod > 0 ? dateForSlot(startPeriod, c.dayOffset) : null;
      byDay[c.dayOffset] ||= {};
      byDay[c.dayOffset][c.time] ||= [];
      byDay[c.dayOffset][c.time].push({ name: c.teacherName, fromDate });
    }

    for (let dayOffset = 0; dayOffset <= 6; dayOffset++) {
      const times = byDay[dayOffset];
      if (!times) continue;
      const items = Object.keys(times)
        .sort((a, b) => a.localeCompare(b))
        .map((time) => ({ time, teachers: times[time] }));
      if (items.length > 0) result.push({ dayOffset, items });
    }
    // Регулярное расписание — сортируем по календарному дню недели ПН→ВС.
    // Разовый перенос — строго хронологически от даты старта (сегодня → +6 дней).
    result.sort((a, b) =>
      isOnce
        ? a.dayOffset - b.dayOffset
        : weekdayOf(a.dayOffset) - weekdayOf(b.dayOffset),
    );
    return result;
  };

  // ── Группы: стабильные окна ──────────────────────────────────────────────────
  // В groupWeeks[period] ключ cell = dayOffset (0..6) от начала периода.
  // Возвращает null, если занятия в этом периоде НЕТ в CRM (расписание ещё не
  // заведено на будущее) — это не то же самое, что «занятие есть, но мест нет».
  const groupFreeAt = (period: number, dayOffset: number, time: string, teacherId: number): number | null => {
    const week = groupWeeks?.[period];
    if (!week) return null;
    const row = week.find((r) => r.time === time && r.teacher_id === teacherId);
    if (!row) return null;
    const cell = row.cells[String(dayOffset)];
    if (!cell) return null;
    return cell.free;
  };

  // Окно считаем стабильным, если:
  //  • в стартовом периоде занятие есть и в нём есть свободные места;
  //  • в следующих периодах оно НЕ становится заполненным.
  // Периоды, на которые расписание в CRM ещё не заведено (занятия нет), не
  // «обнуляют» стабильность — иначе из выдачи пропадали бы почти все дни.
  const isGroupStable = (startPeriod: number, dayOffset: number, time: string, teacherId: number): boolean => {
    const first = groupFreeAt(startPeriod, dayOffset, time, teacherId);
    if (first === null || first <= 0) return false;
    if (isOnce) return true;
    for (let k = 1; k < STABLE_WEEKS; k++) {
      const free = groupFreeAt(startPeriod + k, dayOffset, time, teacherId);
      if (free !== null && free <= 0) return false;
    }
    return true;
  };

  const buildGroupStableDays = (): GroupStableDay[] => {
    const result: GroupStableDay[] = [];
    if (!groupWeeks || groupWeeks.length === 0) return result;

    // Кандидаты — групповые окна из периодов 0..maxStartOffset
    const seen = new Set<string>();
    const candidates: { dayOffset: number; time: string; teacherId: number; teacherName: string }[] = [];
    for (let period = 0; period <= maxStartOffset; period++) {
      const week = groupWeeks[period];
      if (!week) continue;
      for (const row of week) {
        for (const dayStr of Object.keys(row.cells)) {
          const dayOffset = Number(dayStr);
          const key = `${dayOffset}__${row.time}__${row.teacher_id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          candidates.push({
            dayOffset,
            time: row.time,
            teacherId: row.teacher_id,
            teacherName: row.teacher_name,
          });
        }
      }
    }

    const byDay: Record<number, GroupStableDay['items']> = {};
    for (const c of candidates) {
      let startPeriod = -1;
      for (let p = 0; p <= maxStartOffset; p++) {
        if (isGroupStable(p, c.dayOffset, c.time, c.teacherId)) {
          startPeriod = p;
          break;
        }
      }
      if (startPeriod === -1) continue;

      // Свободные места и состав группы берём из периода, с которого окно стартует
      const week = groupWeeks[startPeriod];
      const row = week.find((r) => r.time === c.time && r.teacher_id === c.teacherId);
      const cell = row?.cells[String(c.dayOffset)];
      const free = cell?.free ?? 0;
      const weekday = weekdayOf(c.dayOffset); // 0=ПН..6=ВС
      const isMatveyTueThu = /мацвей|матвей/i.test(c.teacherName)
        && (weekday === 1 || weekday === 3)
        && c.time.slice(0, 5) === '18:45';
      const ageLabel = isMatveyTueThu
        ? 'рекомендуется для детей от 14 до 18 лет'
        : groupAgeLabel(cell?.student_ids || []);
      const fromDate = startPeriod > 0 ? dateForSlot(startPeriod, c.dayOffset) : null;

      byDay[c.dayOffset] ||= [];
      byDay[c.dayOffset].push({ time: c.time, teacher: c.teacherName, free, ageLabel, fromDate });
    }

    for (let dayOffset = 0; dayOffset <= 6; dayOffset++) {
      const items = byDay[dayOffset];
      if (!items || items.length === 0) continue;
      items.sort((a, b) => a.time.localeCompare(b.time));
      result.push({ dayOffset, items });
    }
    // Регулярное расписание — сортируем по календарному дню недели ПН→ВС.
    // Разовый перенос — строго хронологически от даты старта (сегодня → +6 дней).
    result.sort((a, b) =>
      isOnce
        ? a.dayOffset - b.dayOffset
        : weekdayOf(a.dayOffset) - weekdayOf(b.dayOffset),
    );
    return result;
  };

  const fmtFrom = (d: Date) => `с ${fmtRu(d)}`;

  // Средний возраст учеников группы по их student_ids
  const groupAgeLabel = (studentIds: number[]): string => {
    const ages: number[] = [];
    for (const sid of studentIds) {
      const c = customers[sid];
      if (!c) continue;
      const name = formatStudentName(c.name);
      let age: number | null;
      if (shouldForceManualAge(name)) {
        age = manualAge(name);
      } else {
        age = calcAge(c.dob) ?? manualAge(name);
      }
      if (age != null) ages.push(age);
    }
    if (ages.length === 0) return '';
    const avg = ages.reduce((a, b) => a + b, 0) / ages.length;
    const avgRounded = Math.round(avg);
    const from = Math.max(7, avgRounded - 2);
    const to = avgRounded + 2;
    return `рекомендуется для детей от ${from} до ${to} лет`;
  };

  const indStableDays = ready ? buildIndStableDays() : [];
  const groupStableDays = ready ? buildGroupStableDays() : [];

  return {
    startDate,
    minDate,
    type,
    setType,
    building,
    error,
    printRef,
    logoData,
    ready,
    setReady,
    onDateChange,
    loadData,
    downloadPdf,
    weekdayOf,
    fmtFrom,
    indStableDays,
    groupStableDays,
  };
};