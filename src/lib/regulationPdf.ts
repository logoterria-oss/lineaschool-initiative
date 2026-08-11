import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PAGE_PX = 794; // ширина A4 при 96 dpi
const SCALE = 2; // чёткость картинки

// Готовит offscreen-контейнер фиксированной ширины и кладёт в него узел.
const mountOffscreen = (node: HTMLElement): HTMLElement => {
  const holder = document.createElement('div');
  holder.style.position = 'fixed';
  holder.style.left = '-10000px';
  holder.style.top = '0';
  holder.style.width = `${PAGE_PX}px`;
  holder.style.background = '#ffffff';
  holder.style.boxSizing = 'border-box';
  holder.appendChild(node);
  document.body.appendChild(holder);
  return holder;
};

const waitImages = async (root: HTMLElement) => {
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((res) => {
            img.onload = () => res(null);
            img.onerror = () => res(null);
          }),
    ),
  );
};

/**
 * Границы абзацев по вертикали (в пикселях от начала контента).
 * По ним подбираем места разрыва страниц, чтобы не резать текст посередине.
 */
const collectBreakPoints = (root: HTMLElement, holderTop: number): number[] => {
  const points = new Set<number>();

  const walk = (el: HTMLElement, depth: number) => {
    for (const kid of Array.from(el.children) as HTMLElement[]) {
      const rect = kid.getBoundingClientRect();
      if (rect.height > 0) {
        points.add(Math.round(rect.top - holderTop));
        points.add(Math.round(rect.bottom - holderTop));
      }
      // Глубже второго уровня не идём: мелкие строки списков дробят разметку.
      if (depth < 2) walk(kid, depth + 1);
    }
  };

  walk(root, 0);
  return Array.from(points).sort((a, b) => a - b);
};

/** Ближайшая граница абзаца выше желаемого разреза. */
const fitBreak = (points: number[], from: number, limit: number): number => {
  let best = 0;
  for (const p of points) {
    if (p > from && p <= limit) best = p;
    if (p > limit) break;
  }
  return best;
};

// Сохраняет регламент в PDF: один снимок страницы, разрезанный по абзацам.
export const saveElementToPdf = async (
  el: HTMLElement,
  fileName: string,
  title: string,
): Promise<void> => {
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const imgW = pageW - margin * 2;
  const usableH = pageH - margin * 2;

  // Собираем «страницу» целиком: заголовок + весь контент.
  const wrap = document.createElement('div');
  wrap.style.width = '100%';
  wrap.style.background = '#ffffff';
  wrap.style.padding = '0 0 8px';
  wrap.innerHTML =
    `<h1 style="font-size:22px;font-weight:800;color:#111827;` +
    `line-height:1.3;margin:0 0 16px;">${title}</h1>`;

  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.margin = '0';
  clone.style.border = 'none';
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';
  wrap.appendChild(clone);

  const holder = mountOffscreen(wrap);

  try {
    await waitImages(holder);

    const holderTop = holder.getBoundingClientRect().top;
    const breaks = collectBreakPoints(wrap, holderTop);

    // Один снимок всего документа — вместо сотен отдельных.
    const canvas = await html2canvas(holder, {
      scale: SCALE,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });

    const fullWpx = canvas.width;
    const fullHpx = canvas.height;
    // Сколько пикселей исходной вёрстки помещается на страницу PDF.
    const pxPerMM = fullWpx / imgW;
    const pageHpx = Math.floor(usableH * pxPerMM);

    const page = document.createElement('canvas');
    const ctx = page.getContext('2d');
    if (!ctx) return;

    let offset = 0;
    let first = true;

    while (offset < fullHpx) {
      let sliceH = Math.min(pageHpx, fullHpx - offset);

      // Ищем ближайшую границу абзаца, чтобы не разрезать текст.
      if (offset + sliceH < fullHpx) {
        const cut = fitBreak(breaks, offset / SCALE, (offset + sliceH) / SCALE);
        const cutPx = Math.round(cut * SCALE) - offset;
        if (cutPx > pageHpx * 0.4) sliceH = cutPx;
      }

      page.width = fullWpx;
      page.height = sliceH;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, fullWpx, sliceH);
      ctx.drawImage(canvas, 0, offset, fullWpx, sliceH, 0, 0, fullWpx, sliceH);

      if (!first) pdf.addPage();
      first = false;

      pdf.addImage(
        page.toDataURL('image/jpeg', 0.92),
        'JPEG',
        margin,
        margin,
        imgW,
        sliceH / pxPerMM,
      );

      offset += sliceH;
    }

    pdf.save(fileName);
  } finally {
    holder.remove();
  }
};
