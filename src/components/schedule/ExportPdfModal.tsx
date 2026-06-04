import { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  S20_URL,
  TEACHER_SHORT,
  WEEKDAY_SHORT,
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

const ExportPdfModal = ({ onClose }: ExportPdfModalProps) => {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [type, setType] = useState<ScheduleType>('both');
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const [indDays, setIndDays] = useState<IndDay[] | null>(null);
  const [groupRows, setGroupRows] = useState<ReturnType<typeof buildGroupRowsFromLessons> | null>(null);
  const [customers, setCustomers] = useState<Record<number, Customer>>({});
  const [logoData, setLogoData] = useState<string>('');
  const [ready, setReady] = useState(false);

  const onDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    setWeekStart(getMonday(new Date(`${val}T00:00:00`)));
    setReady(false);
  };

  const loadData = async () => {
    setBuilding(true);
    setError('');
    setReady(false);
    try {
      const df = fmtDate(weekStart);
      const dt = fmtDate(addDays(weekStart, 6));

      if (!logoData) {
        try {
          const data = await loadImageAsDataUrl(LOGO_URL);
          setLogoData(data);
        } catch {
          /* не критично — PDF без логотипа */
        }
      }

      if (type === 'individual' || type === 'both') {
        const resp = await fetch(`${S20_URL}?mode=ind_week&date_from=${df}&date_to=${dt}`);
        const data = await resp.json();
        if (data.error) throw new Error(data.error);
        setIndDays(Array.isArray(data.days) ? data.days : []);
      } else {
        setIndDays(null);
      }

      if (type === 'groups' || type === 'both') {
        const resp = await fetch(`${S20_URL}?mode=lessons&date_from=${df}&date_to=${dt}`);
        const data = await resp.json();
        if (data.error) throw new Error(data.error);
        const lessons: RawLesson[] = Array.isArray(data.lessons) ? data.lessons : [];
        let teachers: RawTeacher[] = [];
        try {
          const tresp = await fetch(`${S20_URL}?mode=teachers`);
          const tdata = await tresp.json();
          if (Array.isArray(tdata.teachers)) teachers = tdata.teachers;
          else if (Array.isArray(tdata.items)) teachers = tdata.items;
        } catch {
          /* не критично */
        }
        setGroupRows(buildGroupRowsFromLessons(lessons, teachers, weekStart));

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
        setGroupRows(null);
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

      const fileDate = fmtDate(weekStart);
      pdf.save(`Расписание_${fileDate}.pdf`);
    } catch {
      setError('Не удалось сформировать PDF');
    } finally {
      setBuilding(false);
    }
  };

  const now = new Date();
  const actualNote = `Свободные слоты актуальны на ${now.toLocaleDateString('ru-RU')} - ${now
    .toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;

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

  const groupTimeDays = (rows: ReturnType<typeof buildGroupRowsFromLessons>) => {
    const byDay: Record<number, { time: string; teacher: string; free: number; enrolled: number; ageLabel: string }[]> = {};
    for (const row of rows) {
      for (const [dayStr, cell] of Object.entries(row.cells)) {
        const day = Number(dayStr);
        if (!byDay[day]) byDay[day] = [];
        byDay[day].push({
          time: row.time,
          teacher: row.teacher_name,
          free: cell.free,
          enrolled: cell.enrolled,
          ageLabel: groupAgeLabel(cell.student_ids || []),
        });
      }
    }
    for (const k of Object.keys(byDay)) byDay[Number(k)].sort((a, b) => a.time.localeCompare(b.time));
    return byDay;
  };

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
          {/* Неделя */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Неделя начала занятий
            </label>
            <input
              type="date"
              value={fmtDate(weekStart)}
              onChange={onDateChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              Будет показана неделя: {fmtRu(weekStart)} – {fmtRu(addDays(weekStart, 6))}
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
                <p style={{ fontSize: 13, color: '#4b5563', marginBottom: 4 }}>
                  Неделя: {fmtRu(weekStart)} – {fmtRu(addDays(weekStart, 6))} &nbsp;·&nbsp; Время по МСК (UTC+3)
                </p>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16, fontStyle: 'italic' }}>
                  {actualNote}
                </p>

                {/* Индивидуальные */}
                {(type === 'individual' || type === 'both') && (
                  <div style={{ marginBottom: 20 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f766e', marginBottom: 8 }}>
                      Индивидуальные занятия
                    </h2>
                    {!indDays || indDays.every((d) => d.slots.filter((s) => !s.busy).length === 0) ? (
                      <p style={{ fontSize: 12, color: '#9ca3af' }}>Свободных слотов нет</p>
                    ) : (
                      indDays.map((day) => {
                        const free = day.slots.filter((s) => !s.busy);
                        if (free.length === 0) return null;
                        const byTime: Record<string, string[]> = {};
                        for (const s of free) {
                          (byTime[s.time_from] ||= []).push(
                            TEACHER_SHORT[s.teacher_id] || s.teacher_name,
                          );
                        }
                        return (
                          <div key={day.date} style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                              {WEEKDAY_FULL[day.weekday]}
                            </div>
                            {Object.entries(byTime)
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([time, teachers]) => (
                                <div key={time} style={{ fontSize: 12, color: '#4b5563', paddingLeft: 12 }}>
                                  {time.slice(0, 5)} — {teachers.join(', ')}
                                </div>
                              ))}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Групповые */}
                {(type === 'groups' || type === 'both') && (
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f766e', marginBottom: 8 }}>
                      Групповые занятия (есть места)
                    </h2>
                    {(() => {
                      const byDay = groupRows ? groupTimeDays(groupRows) : {};
                      const daysWithFree = WEEKDAY_SHORT
                        .map((_, day) => day)
                        .filter((day) => (byDay[day] || []).some((x) => x.free > 0));
                      if (daysWithFree.length === 0) {
                        return <p style={{ fontSize: 12, color: '#9ca3af' }}>Свободных мест нет</p>;
                      }
                      return daysWithFree.map((day) => {
                        const items = (byDay[day] || []).filter((x) => x.free > 0);
                        return (
                          <div key={day} style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                              {WEEKDAY_FULL[day]}
                            </div>
                            {items.map((x, i) => (
                              <div key={i} style={{ fontSize: 12, color: '#4b5563', paddingLeft: 12 }}>
                                {x.time} — {x.teacher} (свободно {x.free} из {MAX_GROUP_SIZE})
                                {x.ageLabel && (
                                  <span style={{ color: '#0f766e', fontWeight: 600 }}> — {x.ageLabel}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      });
                    })()}
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