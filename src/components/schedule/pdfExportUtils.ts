import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { fmtDate } from './types';

export type ScheduleType = 'individual' | 'groups' | 'both';

export interface IndSlot {
  time_from: string;
  time_to: string;
  teacher_id: number;
  teacher_name: string;
  busy: boolean;
}
export interface IndDay {
  date: string;
  weekday: number;
  weekday_name: string;
  slots: IndSlot[];
}

export const WEEKDAY_FULL = [
  'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье',
];

export const LOGO_URL =
  'https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/428f7606-17b9-4503-b110-711536d2f8b2.png';

export const IMAGE_PROXY_URL = 'https://functions.poehali.dev/4e7a1ed9-4e38-45c8-804c-decf67141ce5';

// Грузим картинку через image-proxy (отдаёт корректные CORS-заголовки),
// чтобы html2canvas мог отрисовать её без «загрязнения» canvas.
export const loadImageAsDataUrl = async (url: string): Promise<string> => {
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
export const STABLE_WEEKS = 3;
// Максимальный сдвиг старта вперёд: 0 — стартовая неделя, 1 — следующая
export const MAX_START_OFFSET = 1;
// Сколько недель данных грузим: (MAX_START_OFFSET + STABLE_WEEKS) недель
export const WEEKS_TO_LOAD = MAX_START_OFFSET + STABLE_WEEKS; // 4

// Снимает DOM-узел в canvas и сохраняет многостраничный PDF, разрезая
// по пустым (белым) строкам пикселей, чтобы не рвать текст.
export const generatePdf = async (node: HTMLDivElement, startDate: Date): Promise<void> => {
  const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
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
  const fileName = `Расписание_${fileDate}.pdf`;

  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};