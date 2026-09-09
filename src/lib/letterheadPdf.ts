import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const SCALE = 2;

export const buildDocFileName = (title: string, suffix: string): string => {
  const clean = (title || 'Документ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '')
    .slice(0, 70)
    .trim()
    .replace(/\s/g, '_');
  return `${clean || 'Документ'}_${suffix}.pdf`;
};

const buildPdf = async (el: HTMLElement): Promise<jsPDF | null> => {
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const holder = document.createElement('div');
  holder.style.position = 'fixed';
  holder.style.left = '-10000px';
  holder.style.top = '0';
  holder.style.width = '794px';
  holder.style.background = '#ffffff';

  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.width = '794px';
  clone.style.minHeight = '0';
  clone.style.boxShadow = 'none';
  clone.style.border = 'none';
  clone.style.borderRadius = '0';
  holder.appendChild(clone);
  document.body.appendChild(holder);

  try {
    const canvas = await html2canvas(holder, {
      scale: SCALE,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });

    const fullW = canvas.width;
    const fullH = canvas.height;
    const pxPerMM = fullW / pageW;
    const pageHpx = Math.floor(pageH * pxPerMM);

    const page = document.createElement('canvas');
    const ctx = page.getContext('2d');
    if (!ctx) return null;

    let offset = 0;
    let first = true;

    while (offset < fullH) {
      const sliceH = Math.min(pageHpx, fullH - offset);
      page.width = fullW;
      page.height = sliceH;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, fullW, sliceH);
      ctx.drawImage(canvas, 0, offset, fullW, sliceH, 0, 0, fullW, sliceH);

      if (!first) pdf.addPage();
      first = false;

      pdf.addImage(page.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageW, sliceH / pxPerMM);
      offset += sliceH;
    }

    return pdf;
  } finally {
    holder.remove();
  }
};

export const savePaperToPdf = async (el: HTMLElement, fileName: string): Promise<void> => {
  const pdf = await buildPdf(el);
  if (pdf) pdf.save(fileName);
};

export const paperToPdfBase64 = async (el: HTMLElement): Promise<string> => {
  const pdf = await buildPdf(el);
  if (!pdf) return '';
  return pdf.output('datauristring').split(',')[1] || '';
};