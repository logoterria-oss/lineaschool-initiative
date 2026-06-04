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
  getMonday,
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

      // Грузим недели по понедельникам, чтобы индекс дня недели у групп
      // совпадал с календарным weekday у индивидуальных (0=ПН).
      const baseMonday = getMonday(startDate);
      const weekStarts = Array.from({ length: WEEKS_TO_LOAD }, (_, w) => addDays(baseMonday, w * 7));

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

  // День недели даты старта (0=ПН..6=ВС)
  const baseMonday = getMonday(startDate);
  const startWeekday = (() => {
    const wd = startDate.getDay(); // 0=ВС..6=СБ
    return wd === 0 ? 6 : wd - 1; // → 0=ПН..6=ВС
  })();

  // Реальная календарная дата дня недели weekday в неделе с индексом offset
  const dateForSlot = (offsetWeeks: number, weekday: number): Date =>
    addDays(baseMonday, offsetWeeks * 7 + weekday);

  // Минимальный валидный offset недели для дня weekday:
  // если день раньше дня старта в стартовой неделе — начинаем со следующей недели
  const minOffsetForDay = (weekday: number): number => (weekday >= startWeekday ? 0 : 1);

  // ── Индивидуальные: стабильные окна ──────────────────────────────────────────
  // Свободно ли индивид. окно (weekday, time, teacherId) в неделе с индексом w
  const isIndFree = (w: number, weekday: number, time: string, teacherId: number): boolean => {
    const week = indWeeks?.[w];
    if (!week) return false;
    const day = week.find((d) => d.weekday === weekday);
    if (!day) return false;
    return day.slots.some(
      (s) => s.time_from === time && s.teacher_id === teacherId && !s.busy,
    );
  };

  // Стабильно ли окно STABLE_WEEKS недель подряд, начиная с недели startOffset
  const isIndStable = (startOffset: number, weekday: number, time: string, teacherId: number): boolean => {
    for (let k = 0; k < STABLE_WEEKS; k++) {
      if (!isIndFree(startOffset + k, weekday, time, teacherId)) return false;
    }
    return true;
  };

  // Для каждого дня недели — список стабильных индивид. окон (с датой появления, если не с недели старта)
  const buildIndStableDays = () => {
    const result: { weekday: number; items: { time: string; teachers: { name: string; fromDate: Date | null }[] }[] }[] = [];
    if (!indWeeks || indWeeks.length === 0) return result;

    // Кандидаты окон берём из недели старта и следующей недели
    const seen = new Set<string>();
    const candidates: { weekday: number; time: string; teacherId: number; teacherName: string }[] = [];
    for (let off = 0; off <= MAX_START_OFFSET; off++) {
      const week = indWeeks[off];
      if (!week) continue;
      for (const day of week) {
        for (const s of day.slots) {
          if (s.busy) continue;
          const key = `${day.weekday}__${s.time_from}__${s.teacher_id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          candidates.push({
            weekday: day.weekday,
            time: s.time_from,
            teacherId: s.teacher_id,
            teacherName: TEACHER_SHORT[s.teacher_id] || s.teacher_name,
          });
        }
      }
    }

    const byDay: Record<number, Record<string, { name: string; fromDate: Date | null }[]>> = {};
    for (const c of candidates) {
      const minOff = minOffsetForDay(c.weekday);
      // Ищем первую неделю (minOff..MAX_START_OFFSET), с которой окно стабильно
      let startOffset = -1;
      for (let off = minOff; off <= MAX_START_OFFSET; off++) {
        if (isIndStable(off, c.weekday, c.time, c.teacherId)) {
          startOffset = off;
          break;
        }
      }
      if (startOffset === -1) continue; // нестабильно — не предлагаем

      // Дату «с …» показываем, только если начать с ближайшей доступной недели нельзя
      const fromDate = startOffset > minOff ? dateForSlot(startOffset, c.weekday) : null;
      byDay[c.weekday] ||= {};
      byDay[c.weekday][c.time] ||= [];
      byDay[c.weekday][c.time].push({ name: c.teacherName, fromDate });
    }

    for (let wd = 0; wd <= 6; wd++) {
      const times = byDay[wd];
      if (!times) continue;
      const items = Object.keys(times)
        .sort((a, b) => a.localeCompare(b))
        .map((time) => ({ time, teachers: times[time] }));
      if (items.length > 0) result.push({ weekday: wd, items });
    }
    return result;
  };

  // ── Группы: стабильные окна ──────────────────────────────────────────────────
  // Свободно ли групповое окно (weekday, time, teacherId) в неделе w (>=1 место)
  const groupFreeAt = (w: number, weekday: number, time: string, teacherId: number): number => {
    const week = groupWeeks?.[w];
    if (!week) return 0;
    const row = week.find((r) => r.time === time && r.teacher_id === teacherId);
    if (!row) return 0;
    const cell = row.cells[String(weekday)];
    if (!cell) return 0;
    return cell.free;
  };

  const isGroupStable = (startOffset: number, weekday: number, time: string, teacherId: number): boolean => {
    for (let k = 0; k < STABLE_WEEKS; k++) {
      if (groupFreeAt(startOffset + k, weekday, time, teacherId) <= 0) return false;
    }
    return true;
  };

  const buildGroupStableDays = () => {
    const result: {
      weekday: number;
      items: { time: string; teacher: string; free: number; ageLabel: string; fromDate: Date | null }[];
    }[] = [];
    if (!groupWeeks || groupWeeks.length === 0) return result;

    // Кандидаты — все групповые окна из недели старта и следующей недели
    const seen = new Set<string>();
    const candidates: { weekday: number; time: string; teacherId: number; teacherName: string }[] = [];
    for (let off = 0; off <= MAX_START_OFFSET; off++) {
      const week = groupWeeks[off];
      if (!week) continue;
      for (const row of week) {
        for (const dayStr of Object.keys(row.cells)) {
          const weekday = Number(dayStr);
          const key = `${weekday}__${row.time}__${row.teacher_id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          candidates.push({
            weekday,
            time: row.time,
            teacherId: row.teacher_id,
            teacherName: row.teacher_name,
          });
        }
      }
    }

    const byDay: Record<number, typeof result[number]['items']> = {};
    for (const c of candidates) {
      const minOff = minOffsetForDay(c.weekday);
      let startOffset = -1;
      for (let off = minOff; off <= MAX_START_OFFSET; off++) {
        if (isGroupStable(off, c.weekday, c.time, c.teacherId)) {
          startOffset = off;
          break;
        }
      }
      if (startOffset === -1) continue;

      // Свободные места и состав группы берём из недели, с которой окно стартует
      const week = groupWeeks[startOffset];
      const row = week.find((r) => r.time === c.time && r.teacher_id === c.teacherId);
      const cell = row?.cells[String(c.weekday)];
      const free = cell?.free ?? 0;
      const ageLabel = groupAgeLabel(cell?.student_ids || []);
      const fromDate = startOffset > minOff ? dateForSlot(startOffset, c.weekday) : null;

      byDay[c.weekday] ||= [];
      byDay[c.weekday].push({ time: c.time, teacher: c.teacherName, free, ageLabel, fromDate });
    }

    for (let wd = 0; wd <= 6; wd++) {
      const items = byDay[wd];
      if (!items || items.length === 0) continue;
      items.sort((a, b) => a.time.localeCompare(b.time));
      result.push({ weekday: wd, items });
    }
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
                        <div key={day.weekday} style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                            {WEEKDAY_FULL[day.weekday]}
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
                        <div key={day.weekday} style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                            {WEEKDAY_FULL[day.weekday]}
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