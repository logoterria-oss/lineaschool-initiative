import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { LetterData } from '@/components/letterhead/LetterheadSheet';
import { ORG_DETAILS as O } from '@/lib/orgDetails';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export const META_PREFIX = 'LHD1:';

export const encodeMeta = (data: LetterData): string =>
  META_PREFIX + btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(data))));

const decodeMeta = (raw: string): LetterData | null => {
  try {
    const b64 = raw.slice(META_PREFIX.length);
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
};

const isHeaderLine = (l: string) => {
  const s = l.toLowerCase();
  return (
    s.includes('огрнип') ||
    s.includes('инн ') ||
    s.includes('тел.') ||
    s.includes('e-mail') ||
    s.includes(O.site.toLowerCase()) ||
    s.includes(O.address.slice(0, 20).toLowerCase()) ||
    s === 'индивидуальный предприниматель' ||
    s === O.personName.toLowerCase()
  );
};

const isFooterLine = (l: string) => {
  const s = l.toLowerCase().trim();
  return (
    s === 'подпись' ||
    s === 'расшифровка подписи' ||
    s === 'дата подписания' ||
    s.startsWith('м.п.') ||
    s.startsWith('печать не используется')
  );
};

const upperRatio = (s: string) => {
  const letters = s.replace(/[^А-ЯЁа-яё]/g, '');
  if (!letters) return 0;
  const up = s.replace(/[^А-ЯЁ]/g, '').length;
  return up / letters.length;
};

const parseLines = (lines: string[]): Partial<LetterData> => {
  const out: Partial<LetterData> = {};
  const rest: string[] = [];

  for (const l of lines) {
    if (isHeaderLine(l) || isFooterLine(l)) continue;
    const m = l.match(/от\s+(\d{2})\.(\d{2})\.(\d{4})(?:\s*№\s*(\S+))?/);
    if (m) {
      out.docDate = `${m[3]}-${m[2]}-${m[1]}`;
      if (m[4]) out.docNumber = m[4];
      const tail = l.replace(m[0], '').trim();
      if (tail) rest.push(tail);
      continue;
    }
    rest.push(l);
  }

  const recipient: string[] = [];
  let i = 0;
  while (i < rest.length && /^(в |во |директору|руководителю|начальнику|главе|отделение)/i.test(rest[i])) {
    recipient.push(rest[i]);
    i += 1;
  }
  if (recipient.length) out.recipient = recipient.join('\n');

  const title: string[] = [];
  while (i < rest.length && title.length < 3 && upperRatio(rest[i]) > 0.5 && rest[i].length < 90) {
    title.push(rest[i]);
    i += 1;
  }
  if (title.length) out.title = title.join('\n');

  const bodyLines = rest.slice(i).filter((l) => l !== O.signerPost && l !== O.signerName);
  if (bodyLines.length) out.body = bodyLines.join('\n');

  return out;
};

export interface ParseResult {
  data: Partial<LetterData> | null;
  exact: boolean;
  error?: string;
}

export const parsePdfFile = async (file: File): Promise<ParseResult> => {
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;

  const meta = await doc.getMetadata().catch(() => null);
  const kw = (meta?.info as { Keywords?: string } | undefined)?.Keywords || '';
  if (kw.startsWith(META_PREFIX)) {
    const restored = decodeMeta(kw);
    if (restored) return { data: restored, exact: true };
  }

  const chunks: string[] = [];
  for (let p = 1; p <= doc.numPages; p += 1) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    let line = '';
    let lastY: number | null = null;
    for (const item of tc.items as Array<{ str: string; transform: number[] }>) {
      const y = Math.round(item.transform[5]);
      if (lastY !== null && Math.abs(y - lastY) > 3) {
        if (line.trim()) chunks.push(line.trim());
        line = '';
      }
      line += item.str;
      lastY = y;
    }
    if (line.trim()) chunks.push(line.trim());
  }

  const lines = chunks.map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (!lines.length) {
    return {
      data: null,
      exact: false,
      error:
        'В этом PDF нет текстового слоя (документ-картинка или скан) — данные вытащить не получится. Выберите документ из архива.',
    };
  }

  return { data: parseLines(lines), exact: false };
};
