export interface Piece {
  text: string;
  bold: boolean;
}

export type Block =
  | { kind: 'heading'; pieces: Piece[]; level: 1 | 2 }
  | { kind: 'para'; pieces: Piece[] }
  | { kind: 'space' };

/** Кусок строки: **текст** — жирный */
export const parseInline = (line: string): Piece[] => {
  const out: Piece[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push({ text: line.slice(last, m.index), bold: false });
    out.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push({ text: line.slice(last), bold: false });
  return out.length ? out : [{ text: '', bold: false }];
};

/** Разметка документа: # — заголовок по центру, ## — подзаголовок, ** — жирный */
export const parseBlocks = (body: string): Block[] =>
  (body || '').split('\n').map((raw) => {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) return { kind: 'space' } as Block;
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) return { kind: 'heading', level: 2, pieces: parseInline(h2[1]) } as Block;
    const h1 = line.match(/^#\s+(.*)$/);
    if (h1) return { kind: 'heading', level: 1, pieces: parseInline(h1[1]) } as Block;
    return { kind: 'para', pieces: parseInline(line) } as Block;
  });

export const plainText = (pieces: Piece[]): string => pieces.map((p) => p.text).join('');

/** Реквизиты сторон — отдельный блок в конце договора */
export interface Requisites {
  enabled: boolean;
  heading: string;
  leftTitle: string;
  leftBody: string;
  leftSign: string;
  leftDate: string;
  rightTitle: string;
  rightBody: string;
  rightSign: string;
  rightDate: string;
}

export const EMPTY_REQUISITES: Requisites = {
  enabled: false,
  heading: 'АДРЕСА, РЕКВИЗИТЫ И ПОДПИСИ СТОРОН',
  leftTitle: 'Исполнитель:',
  leftBody: '',
  leftSign: '',
  leftDate: '',
  rightTitle: 'Заказчик:',
  rightBody: '',
  rightSign: '',
  rightDate: '',
};