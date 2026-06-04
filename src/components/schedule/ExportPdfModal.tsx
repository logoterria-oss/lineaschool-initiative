import { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  S20_URL,
  TEACHER_SHORT,
  RawLesson,
  RawTeacher,
  Customer,
  MAX_GROUP_SIZE,
  fmtDate,
  addDays,
  fmtRu,
  buildGroupRowsFromLessons,
  calcAge,
  formatStudentName,
  manualAge,
  shouldForceManualAge,
} from './types';

type ScheduleType = 'individual' | 'groups' | 'both';

interface IndSlot {
  time_from: string;
  time_to: string;
  teacher_id: number;
  teacher_name: string;
  busy: boolean;
}
interface IndDay {
  date: string;
  weekday: number;
  weekday_name: string;
  slots: IndSlot[];
}

interface ExportPdfModalProps {
  onClose: () => void;
}

const WEEKDAY_FULL = [
  'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье',
];

const LOGO_URL =
  'https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/428f7606-17b9-4503-b110-711536d2f8b2.png';

const IMAGE_PROXY_URL = 'https://functions.poehali.dev/4e7a1ed9-4e38-45c8-804c-decf67141ce5';

// Грузим картинку через image-proxy (отдаёт корректные CORS-заголовки),
// чтобы html2canvas мог отрисовать её без «загрязнения» canvas.
const loadImageAsDataUrl = async (url: string): Promise<string> => {
  const resp = await fetch(`${IMAGE_PROXY_URL}?url=${encodeURIComponent(url)}`);
  const blob = await resp.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// На сколько недель подряд проверяем стабильность окна (включая стартовую)
const STABLE_WEEKS = 3;
// Максимальный сдвиг старта вперёд: 0 — стартовая неделя, 1 — следующая
const MAX_START_OFFSET = 1;
// Сколько недель данных грузим: (MAX_START_OFFSET + STABLE_WEEKS) недель
const WEEKS_TO_LOAD = MAX_START_OFFSET + STABLE_WEEKS; // 4

const ExportPdfModal = ({ onClose }: ExportPdfModalProps) => {
  // Дата, с которой клиент готов начать заниматься (не обязательно понедельник)
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
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
    setStartDate(d);
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
      const weekStarts = Array.from({ length: WEEKS_TO_LOAD }, (_, w) => addDays(startDate, w * 7));

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
      // Убеждаемся, что логотип загружен и попал в DOM перед снимком
      if (!logoData) {
        try {
          const data = await loadImageAsDataUrl(LOGO_URL);
          setLogoData(data);
          await new Promise((r) => setTimeout(r, 100));
        } catch {
          /* не критично */
        }
      }
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 10;
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const contentW = pageW - margin * 2;
      const contentH = pageH - margin * 2;

      // Сколько пикселей исходного canvas помещается на одну страницу по высоте
      const pxPerPage = Math.floor((canvas.width * contentH) / contentW);

      const srcCtx = canvas.getContext('2d');

      // Проверяет, является ли строка пикселей полностью белой (можно резать здесь)
      const isRowBlank = (y: number): boolean => {
        if (!srcCtx || y < 0 || y >= canvas.height) return false;
        const data = srcCtx.getImageData(0, y, canvas.width, 1).data;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) return false;
        }
        return true;
      };

      let renderedPx = 0;
      let firstPage = true;
      while (renderedPx < canvas.height) {
        let sliceH = Math.min(pxPerPage, canvas.height - renderedPx);

        // Если режем не до конца — ищем ближайшую пустую строку выше границы,
        // чтобы не разрезать текст пополам
        if (renderedPx + sliceH < canvas.height) {
          const minSlice = Math.floor(pxPerPage * 0.5);
          let cut = sliceH;
          while (cut > minSlice && !isRowBlank(renderedPx + cut)) {
            cut -= 1;
          }
          if (cut > minSlice) sliceH = cut;
        }

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceH;
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0, renderedPx, canvas.width, sliceH,
            0, 0, canvas.width, sliceH,
          );
        }

        const sliceImgH = (sliceH * contentW) / canvas.width;
        if (!firstPage) pdf.addPage();
        pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', margin, margin, contentW, sliceImgH);

        renderedPx += sliceH;
        firstPage = false;
      }

      const fileDate = fmtDate(startDate);
      pdf.save(`Расписание_${fileDate}.pdf`);
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

  // Стабильно ли окно STABLE_WEEKS периодов подряд, начиная с периода startPeriod
  const isIndStable = (startPeriod: number, dayOffset: number, time: string, teacherId: number): boolean => {
    for (let k = 0; k < STABLE_WEEKS; k++) {
      if (!isIndFree(startPeriod + k, dayOffset, time, teacherId)) return false;
    }
    return true;
  };

  const buildIndStableDays = () => {
    const result: { dayOffset: number; items: { time: string; teachers: { name: string; fromDate: Date | null }[] }[] }[] = [];
    if (!indWeeks || indWeeks.length === 0) return result;

    // Кандидаты окон — из периода 0 и периода 1
    const seen = new Set<string>();
    const candidates: { dayOffset: number; time: string; teacherId: number; teacherName: string }[] = [];
    for (let period = 0; period <= MAX_START_OFFSET; period++) {
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
      // Ищем первый период (0..MAX_START_OFFSET), с которого окно стабильно
      let startPeriod = -1;
      for (let p = 0; p <= MAX_START_OFFSET; p++) {
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
    // Сортируем по календарному дню недели: ПН→ВС
    result.sort((a, b) => weekdayOf(a.dayOffset) - weekdayOf(b.dayOffset));
    return result;
  };

  // ── Группы: стабильные окна ──────────────────────────────────────────────────
  // В groupWeeks[period] ключ cell = dayOffset (0..6) от начала периода
  const groupFreeAt = (period: number, dayOffset: number, time: string, teacherId: number): number => {
    const week = groupWeeks?.[period];
    if (!week) return 0;
    const row = week.find((r) => r.time === time && r.teacher_id === teacherId);
    if (!row) return 0;
    const cell = row.cells[String(dayOffset)];
    if (!cell) return 0;
    return cell.free;
  };

  const isGroupStable = (startPeriod: number, dayOffset: number, time: string, teacherId: number): boolean => {
    for (let k = 0; k < STABLE_WEEKS; k++) {
      if (groupFreeAt(startPeriod + k, dayOffset, time, teacherId) <= 0) return false;
    }
    return true;
  };

  const buildGroupStableDays = () => {
    const result: {
      dayOffset: number;
      items: { time: string; teacher: string; free: number; ageLabel: string; fromDate: Date | null }[];
    }[] = [];
    if (!groupWeeks || groupWeeks.length === 0) return result;

    // Кандидаты — групповые окна из периода 0 и периода 1
    const seen = new Set<string>();
    const candidates: { dayOffset: number; time: string; teacherId: number; teacherName: string }[] = [];
    for (let period = 0; period <= MAX_START_OFFSET; period++) {
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

    const byDay: Record<number, typeof result[number]['items']> = {};
    for (const c of candidates) {
      let startPeriod = -1;
      for (let p = 0; p <= MAX_START_OFFSET; p++) {
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
      const ageLabel = groupAgeLabel(cell?.student_ids || []);
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
    // Сортируем по календарному дню недели: ПН→ВС
    result.sort((a, b) => weekdayOf(a.dayOffset) - weekdayOf(b.dayOffset));
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
    if (avg > 11 && avg < 14) return 'средняя группа (12–15 лет)';
    if (avg >= 14) return 'старшая группа (14–18 лет)';
    return '';
  };

  const indStableDays = ready ? buildIndStableDays() : [];
  const groupStableDays = ready ? buildGroupStableDays() : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h2 className="font-bold text-lg text-gray-900">Создать PDF с расписанием</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-4">
          {/* Дата старта */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Дата, с которой клиент готов начать
            </label>
            <input
              type="date"
              value={fmtDate(startDate)}
              onChange={onDateChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              Окна с {fmtRu(startDate)} по {fmtRu(addDays(startDate, 6))}. Предлагаем только те, что свободны 3 недели подряд.
            </p>
          </div>

          {/* Тип занятий */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Что включить</label>
            <div className="flex gap-2 flex-wrap">
              {([
                ['individual', 'Индивидуальные'],
                ['groups', 'Групповые'],
                ['both', 'Индивидуальные + групповые'],
              ] as [ScheduleType, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => { setType(val); setReady(false); }}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    type === val
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {!ready ? (
            <Button onClick={loadData} disabled={building} className="w-full gap-2">
              {building ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="FileText" size={16} />}
              {building ? 'Загрузка…' : 'Сформировать предпросмотр'}
            </Button>
          ) : (
            <Button onClick={downloadPdf} disabled={building} className="w-full gap-2 bg-green-600 hover:bg-green-700">
              {building ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Download" size={16} />}
              Скачать PDF
            </Button>
          )}

          {/* Предпросмотр — он же источник для PDF */}
          {ready && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div ref={printRef} className="bg-white p-6" style={{ width: 720 }}>
                <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #e5e7eb' }}>
                  {logoData && (
                    <img
                      src={logoData}
                      alt="ЛинэяСкул"
                      style={{ height: 56, objectFit: 'contain' }}
                    />
                  )}
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                  Свободные слоты для записи
                </h1>
                <p style={{ fontSize: 13, color: '#4b5563', marginBottom: 12 }}>
                  Начало занятий: {fmtRu(startDate)} – {fmtRu(addDays(startDate, 6))}
                </p>
                <div
                  style={{
                    display: 'inline-block',
                    background: '#fef3c7',
                    border: '1px solid #f59e0b',
                    borderRadius: 6,
                    padding: '4px 10px',
                    marginBottom: 16,
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#92400e',
                  }}
                >
                  ⏰ Время указано по Москве (МСК, UTC+3)
                </div>

                {/* Индивидуальные */}
                {(type === 'individual' || type === 'both') && (
                  <div style={{ marginBottom: 20 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f766e', marginBottom: 8 }}>
                      Индивидуальные занятия
                    </h2>
                    {indStableDays.length === 0 ? (
                      <p style={{ fontSize: 12, color: '#9ca3af' }}>Свободных слотов нет</p>
                    ) : (
                      indStableDays.map((day) => (
                        <div key={day.dayOffset} style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                            {WEEKDAY_FULL[weekdayOf(day.dayOffset)]}
                          </div>
                          {day.items.map((item) => (
                            <div key={item.time} style={{ fontSize: 12, color: '#4b5563', paddingLeft: 12 }}>
                              {item.time.slice(0, 5)} —{' '}
                              {item.teachers.map((t, i) => (
                                <span key={i}>
                                  {i > 0 && ', '}
                                  {t.name}
                                  {t.fromDate && (
                                    <span style={{ color: '#b45309', fontWeight: 600 }}> ({fmtFrom(t.fromDate)})</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Групповые */}
                {(type === 'groups' || type === 'both') && (
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f766e', marginBottom: 8 }}>
                      Групповые занятия (есть места)
                    </h2>
                    {groupStableDays.length === 0 ? (
                      <p style={{ fontSize: 12, color: '#9ca3af' }}>Свободных мест нет</p>
                    ) : (
                      groupStableDays.map((day) => (
                        <div key={day.dayOffset} style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                            {WEEKDAY_FULL[weekdayOf(day.dayOffset)]}
                          </div>
                          {day.items.map((x, i) => (
                            <div key={i} style={{ fontSize: 12, color: '#4b5563', paddingLeft: 12 }}>
                              {x.time} — {x.teacher} (свободно {x.free} из {MAX_GROUP_SIZE})
                              {x.ageLabel && (
                                <span style={{ color: '#0f766e', fontWeight: 600 }}> — {x.ageLabel}</span>
                              )}
                              {x.fromDate && (
                                <span style={{ color: '#b45309', fontWeight: 600 }}> ({fmtFrom(x.fromDate)})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportPdfModal;