import jsPDF from 'jspdf';
import { ORG_DETAILS as O } from '@/lib/orgDetails';
import { Block, Piece, Requisites } from '@/lib/letterheadMarkup';

const FONT_PROXY = 'https://functions.poehali.dev/3f32132e-3d38-4099-90c1-0fa0d31dd012';

const PAGE_W = 210;
const PAGE_H = 297;
const ML = 20;
const MR = 15;
const MT = 14;
const MB = 16;
const TEXT_W = PAGE_W - ML - MR;

const FS_BODY = 11;
const FS_H1 = 13;
const FS_H2 = 11.5;
const LINE = 5.2;

export const buildDocFileName = (title: string, suffix: string): string => {
  const clean = (title || 'Документ')
    .replace(/[#*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '')
    .slice(0, 70)
    .trim()
    .replace(/\s/g, '_');
  return `${clean || 'Документ'}_${suffix}.pdf`;
};

let fontCache: Record<string, string> | null = null;

const loadFonts = async (doc: jsPDF) => {
  if (!fontCache) {
    const [n, b] = await Promise.all(
      ['normal', 'bold'].map((s) => fetch(`${FONT_PROXY}?style=${s}`).then((r) => r.json())),
    );
    fontCache = { normal: n.b64, bold: b.b64 };
  }
  doc.addFileToVFS('NS-normal.ttf', fontCache.normal);
  doc.addFont('NS-normal.ttf', 'NS', 'normal');
  doc.addFileToVFS('NS-bold.ttf', fontCache.bold);
  doc.addFont('NS-bold.ttf', 'NS', 'bold');
  doc.setFont('NS', 'normal');
};

const dmy = (iso: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
};

interface Word {
  text: string;
  bold: boolean;
}

/** Слова строки с сохранением жирности каждого */
const toWords = (pieces: Piece[]): Word[] => {
  const words: Word[] = [];
  pieces.forEach((p) => {
    p.text.split(/(\s+)/).forEach((w) => {
      if (w !== '') words.push({ text: w, bold: p.bold });
    });
  });
  return words;
};

/** Курсор рисования: сам добавляет страницы, когда текст не помещается */
class Cursor {
  y = MT;

  constructor(public doc: jsPDF, private onNewPage?: (d: jsPDF) => number) {}

  need(h: number) {
    if (this.y + h <= PAGE_H - MB) return;
    this.doc.addPage();
    this.y = this.onNewPage ? this.onNewPage(this.doc) : MT;
  }
}

const widthOf = (doc: jsPDF, w: Word, size: number) => {
  doc.setFont('NS', w.bold ? 'bold' : 'normal');
  doc.setFontSize(size);
  return doc.getTextWidth(w.text);
};

/** Разложить слова по строкам нужной ширины */
const wrap = (doc: jsPDF, words: Word[], size: number, maxW: number): Word[][] => {
  const lines: Word[][] = [];
  let cur: Word[] = [];
  let w = 0;
  words.forEach((word) => {
    const ww = widthOf(doc, word, size);
    const isSpace = !word.text.trim();
    if (w + ww > maxW && cur.length) {
      lines.push(cur);
      cur = [];
      w = 0;
      if (isSpace) return;
    }
    cur.push(word);
    w += ww;
  });
  if (cur.length) lines.push(cur);
  return lines;
};

const drawLine = (
  doc: jsPDF,
  words: Word[],
  size: number,
  y: number,
  align: 'left' | 'center' | 'justify',
  maxW: number,
  justify: boolean,
) => {
  const trimmed = [...words];
  while (trimmed.length && !trimmed[trimmed.length - 1].text.trim()) trimmed.pop();
  if (!trimmed.length) return;

  const widths = trimmed.map((w) => widthOf(doc, w, size));
  const total = widths.reduce((a, b) => a + b, 0);

  let x = ML;
  if (align === 'center') x = ML + (maxW - total) / 2;

  // По ширине: лишнее место равномерно раскидываем по пробелам
  let extra = 0;
  if (justify && align === 'justify') {
    const spaces = trimmed.filter((w) => !w.text.trim()).length;
    if (spaces > 0 && total < maxW) extra = (maxW - total) / spaces;
  }

  trimmed.forEach((w, i) => {
    doc.setFont('NS', w.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.text(w.text, x, y);
    x += widths[i] + (!w.text.trim() ? extra : 0);
  });
};

/** Шапка бланка — печатается на первой странице */
const drawHeader = (doc: jsPDF): number => {
  const cx = PAGE_W / 2;
  let y = MT + 4;

  doc.setFont('NS', 'bold');
  doc.setFontSize(10.5);
  doc.text('ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ', cx, y, { align: 'center' });
  y += 6;
  doc.setFontSize(14);
  doc.text(O.personName.toUpperCase(), cx, y, { align: 'center' });
  y += 5.5;

  doc.setFont('NS', 'normal');
  doc.setFontSize(8.5);
  doc.text(`ОГРНИП ${O.ogrnip} · ИНН ${O.inn}`, cx, y, { align: 'center' });
  y += 4;
  doc.text(O.address, cx, y, { align: 'center' });
  y += 4;
  doc.text(`Тел.: ${O.phone} · E-mail: ${O.email} · ${O.site}`, cx, y, { align: 'center' });
  y += 3.5;

  doc.setLineWidth(0.7);
  doc.line(ML, y, PAGE_W - MR, y);
  y += 1.2;
  doc.setLineWidth(0.25);
  doc.line(ML, y, PAGE_W - MR, y);

  return y + 8;
};

const drawBlocks = (cur: Cursor, blocks: Block[]) => {
  const { doc } = cur;

  blocks.forEach((b) => {
    if (b.kind === 'space') {
      cur.need(LINE * 0.6);
      cur.y += LINE * 0.6;
      return;
    }

    const isHead = b.kind === 'heading';
    const size = !isHead ? FS_BODY : b.level === 1 ? FS_H1 : FS_H2;
    const words = toWords(b.pieces).map((w) => (isHead ? { ...w, bold: true } : w));
    const lines = wrap(doc, words, size, TEXT_W);
    const lh = isHead ? LINE * 1.15 : LINE;

    if (isHead) {
      cur.need(lh * lines.length + 3);
      cur.y += 2.5;
    }

    lines.forEach((ln, i) => {
      cur.need(lh);
      cur.y += lh;
      drawLine(
        doc,
        ln,
        size,
        cur.y,
        isHead ? 'center' : 'justify',
        TEXT_W,
        !isHead && i < lines.length - 1,
      );
    });

    if (isHead) cur.y += 2;
  });
};

/** Реквизиты сторон: две колонки, при нехватке места уезжают на новую страницу */
const drawRequisites = (cur: Cursor, r: Requisites) => {
  const { doc } = cur;
  const gap = 10;
  const colW = (TEXT_W - gap) / 2;
  const colX = [ML, ML + colW + gap];

  cur.need(20);
  cur.y += 6;

  const column = (side: 0 | 1, startY: number): number => {
    const title = side === 0 ? r.leftTitle : r.rightTitle;
    const body = side === 0 ? r.leftBody : r.rightBody;
    const sign = side === 0 ? r.leftSign : r.rightSign;
    const dateTxt = side === 0 ? r.leftDate : r.rightDate;
    const x = colX[side];
    let y = startY;

    doc.setFont('NS', 'bold');
    doc.setFontSize(FS_BODY);
    doc.text(title, x, y);
    y += LINE * 1.2;

    doc.setFont('NS', 'normal');
    doc.setFontSize(10);
    body.split('\n').forEach((raw) => {
      if (!raw.trim()) {
        y += LINE * 0.6;
        return;
      }
      doc.splitTextToSize(raw, colW).forEach((s: string) => {
        doc.text(s, x, y);
        y += LINE * 0.92;
      });
    });

    y += LINE * 2.2;
    doc.setLineWidth(0.25);
    doc.line(x, y, x + 42, y);
    doc.setFontSize(10);
    doc.text(`/ ${sign} /`, x + 46, y);
    y += 4;
    doc.setFontSize(8);
    doc.setTextColor(90);
    doc.text('(подпись)', x + 8, y);
    doc.text('(расшифровка)', x + 46, y);
    doc.setTextColor(0);

    y += LINE * 2;
    doc.setFontSize(10);
    doc.text(dateTxt, x, y);
    return y;
  };

  const top = cur.y;
  const h = Math.max(column(0, top), column(1, top));
  cur.y = h;
};

export interface PdfInput {
  title: string;
  docNumber: string;
  docDate: string;
  recipient: string;
  blocks: Block[];
  requisites: Requisites;
  signerPost: string;
  signerName: string;
  city: string;
  stampMode: 'none' | 'mp' | 'note';
  showSignature: boolean;
}

const buildPdf = async (input: PdfInput, meta?: string): Promise<jsPDF> => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  await loadFonts(doc);
  if (meta) doc.setProperties({ keywords: meta });

  const cur = new Cursor(doc);
  cur.y = drawHeader(doc);

  // Номер и дата слева, адресат справа
  const dateStr = input.docDate ? `от ${dmy(input.docDate)}` : '';
  const numStr = input.docNumber ? ` № ${input.docNumber}` : '';
  const leftTop = `${dateStr}${numStr}`.trim();

  if (leftTop || input.recipient) {
    doc.setFont('NS', 'normal');
    doc.setFontSize(10.5);
    const startY = cur.y;
    if (leftTop) doc.text(leftTop, ML, startY);
    let ry = startY;
    if (input.recipient) {
      const rw = 75;
      input.recipient.split('\n').forEach((raw) => {
        doc.splitTextToSize(raw, rw).forEach((s: string) => {
          doc.text(s, PAGE_W - MR, ry, { align: 'right' });
          ry += LINE * 0.95;
        });
      });
    }
    cur.y = Math.max(startY + LINE, ry) + 6;
  }

  if (input.title.trim()) {
    doc.setFont('NS', 'bold');
    doc.setFontSize(FS_H1 + 0.5);
    input.title.split('\n').forEach((raw) => {
      if (!raw.trim()) {
        cur.y += LINE * 0.6;
        return;
      }
      doc.splitTextToSize(raw, TEXT_W).forEach((s: string) => {
        cur.need(LINE * 1.2);
        cur.y += LINE * 1.2;
        doc.text(s, PAGE_W / 2, cur.y, { align: 'center' });
      });
    });
    cur.y += 5;
  }

  drawBlocks(cur, input.blocks);

  if (input.requisites.enabled) drawRequisites(cur, input.requisites);

  if (input.showSignature) {
    cur.need(30);
    cur.y += 14;
    doc.setFont('NS', 'normal');
    doc.setFontSize(10.5);
    doc.text(input.signerPost, ML, cur.y);
    doc.setLineWidth(0.25);
    doc.line(PAGE_W - MR - 78, cur.y, PAGE_W - MR - 40, cur.y);
    doc.text(input.signerName, PAGE_W - MR - 36, cur.y);
    cur.y += 4;
    doc.setFontSize(8);
    doc.setTextColor(90);
    doc.text('(подпись)', PAGE_W - MR - 70, cur.y);
    doc.text('(расшифровка)', PAGE_W - MR - 36, cur.y);
    doc.setTextColor(0);

    const stamp =
      input.stampMode === 'mp'
        ? 'М.П.'
        : input.stampMode === 'note'
          ? 'Печать не используется'
          : '';
    if (stamp || input.city) {
      cur.y += 10;
      doc.setFontSize(9.5);
      doc.setTextColor(90);
      doc.text([stamp, input.city].filter(Boolean).join('   '), ML, cur.y);
      doc.setTextColor(0);
    }
  }

  // Нумерация страниц
  const total = doc.getNumberOfPages();
  if (total > 1) {
    for (let p = 1; p <= total; p += 1) {
      doc.setPage(p);
      doc.setFont('NS', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(String(p), PAGE_W / 2, PAGE_H - 8, { align: 'center' });
      doc.setTextColor(0);
    }
  }

  if (meta) {
    doc.setPage(1);
    doc.setFontSize(1);
    const chunks = meta.match(/.{1,90}/g) || [];
    chunks.forEach((c, i) => {
      doc.text(c, 2, 4 + i * 1.2, { renderingMode: 'invisible' });
    });
  }

  return doc;
};

export const savePaperToPdf = async (
  input: PdfInput,
  fileName: string,
  meta?: string,
): Promise<void> => {
  const doc = await buildPdf(input, meta);
  doc.save(fileName);
};

export const paperToPdfBase64 = async (input: PdfInput, meta?: string): Promise<string> => {
  const doc = await buildPdf(input, meta);
  return doc.output('datauristring').split(',')[1] || '';
};
