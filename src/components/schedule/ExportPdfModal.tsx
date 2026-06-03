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
  MAX_GROUP_SIZE,
  fmtDate,
  getMonday,
  addDays,
  fmtRu,
  buildGroupRowsFromLessons,
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

const ExportPdfModal = ({ onClose }: ExportPdfModalProps) => {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [type, setType] = useState<ScheduleType>('both');
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const [indDays, setIndDays] = useState<IndDay[] | null>(null);
  const [groupRows, setGroupRows] = useState<ReturnType<typeof buildGroupRowsFromLessons> | null>(null);
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
      } else {
        setGroupRows(null);
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
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 10;
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const contentW = pageW - margin * 2;
      const contentH = pageH - margin * 2;

      // Сколько пикселей исходного canvas помещается на одну страницу по высоте
      const pxPerPage = Math.floor((canvas.width * contentH) / contentW);

      let renderedPx = 0;
      let firstPage = true;
      while (renderedPx < canvas.height) {
        const sliceH = Math.min(pxPerPage, canvas.height - renderedPx);

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

  const groupTimeDays = (rows: ReturnType<typeof buildGroupRowsFromLessons>) => {
    const byDay: Record<number, { time: string; teacher: string; free: number; enrolled: number }[]> = {};
    for (const row of rows) {
      for (const [dayStr, cell] of Object.entries(row.cells)) {
        const day = Number(dayStr);
        if (!byDay[day]) byDay[day] = [];
        byDay[day].push({
          time: row.time,
          teacher: row.teacher_name,
          free: cell.free,
          enrolled: cell.enrolled,
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #e5e7eb' }}>
                  <img
                    src="https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/602a60ff-336d-4e7c-a660-f1e187ebc3cd.png"
                    alt="ЛинэяСкул"
                    crossOrigin="anonymous"
                    style={{ height: 56, objectFit: 'contain' }}
                  />
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#0f766e' }}>ЛинэяСкул</span>
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                  Свободные слоты для записи
                </h1>
                <p style={{ fontSize: 13, color: '#4b5563', marginBottom: 4 }}>
                  Неделя: {fmtRu(weekStart)} – {fmtRu(addDays(weekStart, 6))}
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
                          <div key={day.date} style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                              {WEEKDAY_FULL[day.weekday]} {fmtRu(new Date(`${day.date}T00:00:00`))}
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
                          <div key={day} style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                              {WEEKDAY_FULL[day]} {fmtRu(addDays(weekStart, day))}
                            </div>
                            {items.map((x, i) => (
                              <div key={i} style={{ fontSize: 12, color: '#4b5563', paddingLeft: 12 }}>
                                {x.time} — {x.teacher} (свободно {x.free} из {MAX_GROUP_SIZE})
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