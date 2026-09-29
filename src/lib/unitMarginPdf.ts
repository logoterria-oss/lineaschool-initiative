import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { UnitMarginResults, UnitMonthTotals } from './unitMarginModel';
import { monthLabel } from './unitMarginModel';

const FONT_PROXY = 'https://functions.poehali.dev/3f32132e-3d38-4099-90c1-0fa0d31dd012';

type Rgb = [number, number, number];

/** Фирменный зелёный — как в остальных отчётах школы. */
const BRAND: Rgb = [34, 139, 87];
const WHITE: Rgb = [255, 255, 255];

const money = (n: number) =>
  `${Math.round(n).toLocaleString('ru-RU')} ₽`;

const money2 = (n: number) =>
  `${(Math.round(n * 100) / 100).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₽`;

const percent = (n: number) => `${Math.round(n * 100) / 100}%`;

interface PdfOptions {
  result: UnitMarginResults;
  totals: UnitMonthTotals | null;
  month: string;
}

/**
 * PDF «Маржинальность урока»: только три цифры, ради которых отчёт и нужен —
 * маржинальность индивидуальных занятий, групповых и средняя по всем урокам.
 *
 * Разбор расходов, педагоги и план сюда не идут: документ делается для
 * быстрого взгляда и пересылки, а не для аудита расчёта.
 */
export async function downloadUnitMarginPdf({ result, totals, month }: PdfOptions) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Кириллица в jsPDF работает только со своим шрифтом — грузим Noto Sans
  const loadFont = async (style: string) => {
    const resp = await fetch(`${FONT_PROXY}?style=${style}`);
    const data = await resp.json();
    doc.addFileToVFS(`NotoSans-${style}.ttf`, data.b64);
    doc.addFont(`NotoSans-${style}.ttf`, 'NotoSans', style);
  };

  await loadFont('normal');
  await loadFont('bold');
  doc.setFont('NotoSans');

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;

  // ── Шапка ──
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageW, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('NotoSans', 'bold');
  doc.text('Маржинальность урока', margin, 13);
  doc.setFontSize(10);
  doc.setFont('NotoSans', 'normal');
  doc.text(monthLabel(month), margin, 19.5);
  doc.text(
    `Сформирован: ${new Date().toLocaleDateString('ru-RU')}`,
    pageW - margin, 19.5, { align: 'right' },
  );

  // ── Три главные цифры крупно ──
  const cardY = 34;
  const cardH = 30;
  const gap = 5;
  const cardW = (pageW - margin * 2 - gap * 2) / 3;

  const cards: { title: string; value: string; sub: string }[] = [
    {
      title: 'Индивидуальные',
      value: percent(result.individual.marginPercent),
      sub: `маржа ${money2(result.individual.margin)} с занятия`,
    },
    {
      title: 'Групповые',
      value: percent(result.group.marginPercent),
      sub: `маржа ${money2(result.group.margin)} с занятия`,
    },
    {
      title: 'В среднем',
      value: totals ? percent(totals.marginPercent) : '—',
      sub: totals ? `маржа ${money(totals.margin)} за месяц` : 'нет данных',
    },
  ];

  cards.forEach((c, i) => {
    const x = margin + i * (cardW + gap);
    // Средняя — главная цифра отчёта, поэтому выделена заливкой
    const isMain = i === 2;
    if (isMain) {
      doc.setFillColor(...BRAND);
      doc.rect(x, cardY, cardW, cardH, 'F');
    } else {
      doc.setDrawColor(215, 215, 215);
      doc.setFillColor(250, 250, 250);
      doc.rect(x, cardY, cardW, cardH, 'FD');
    }

    const titleColor: Rgb = isMain ? WHITE : [110, 110, 110];
    const valueColor: Rgb = isMain ? WHITE : BRAND;
    const subColor: Rgb = isMain ? [235, 245, 240] : [130, 130, 130];

    doc.setFontSize(9);
    doc.setFont('NotoSans', 'normal');
    doc.setTextColor(...titleColor);
    doc.text(c.title, x + cardW / 2, cardY + 7, { align: 'center' });

    doc.setFontSize(19);
    doc.setFont('NotoSans', 'bold');
    doc.setTextColor(...valueColor);
    doc.text(c.value, x + cardW / 2, cardY + 17.5, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setFont('NotoSans', 'normal');
    doc.setTextColor(...subColor);
    doc.text(c.sub, x + cardW / 2, cardY + 25, { align: 'center' });
  });

  // ── Таблица с разбором по формам занятий ──
  let y = cardY + cardH + 12;
  doc.setFontSize(11);
  doc.setFont('NotoSans', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Экономика одного занятия', margin, y);

  autoTable(doc, {
    startY: y + 3,
    head: [['Показатель', 'Индивидуальное', 'Групповое']],
    body: [
      [
        'Выручка занятия',
        money2(result.individual.revenue),
        money2(result.group.revenue),
      ],
      [
        'Переменные расходы',
        money2(result.individual.costTotal),
        money2(result.group.costTotal),
      ],
      [
        'Маржинальная прибыль',
        money2(result.individual.margin),
        money2(result.group.margin),
      ],
      [
        'Маржинальность',
        percent(result.individual.marginPercent),
        percent(result.group.marginPercent),
      ],
      [
        'Оплаченных мест на занятии',
        String(result.individual.clientsPerLesson),
        String(result.group.clientsPerLesson),
      ],
    ],
    theme: 'striped',
    headStyles: {
      fillColor: BRAND, textColor: 255, fontStyle: 'bold',
      fontSize: 9.5, font: 'NotoSans', halign: 'center',
    },
    styles: { fontSize: 9.5, cellPadding: 3, font: 'NotoSans' },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 42, halign: 'right' },
      2: { cellWidth: 42, halign: 'right' },
    },
    alternateRowStyles: { fillColor: [245, 252, 248] },
    margin: { left: margin, right: margin },
    // Строку маржинальности выделяем — это вывод таблицы
    didParseCell: (d) => {
      if (d.section === 'body' && d.row.index === 3) {
        d.cell.styles.fontStyle = 'bold';
        d.cell.styles.textColor = BRAND;
      }
    },
  });

  // ── Итог месяца ──
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  if (totals) {
    doc.setFontSize(11);
    doc.setFont('NotoSans', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Итог месяца', margin, y);

    autoTable(doc, {
      startY: y + 3,
      head: [],
      body: [
        ['Проведено занятий', `${totals.lessons} (инд. ${totals.individualLessons} / гр. ${totals.groupLessons})`],
        ['Выручка месяца', money(totals.revenue)],
        ['Переменные расходы', money(totals.costTotal)],
        ['Маржинальная прибыль', `${money(totals.margin)} (${percent(totals.marginPercent)})`],
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2.5, font: 'NotoSans' },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60, textColor: [80, 80, 80] },
        1: { textColor: [20, 20, 20] },
      },
      margin: { left: margin, right: margin },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ── Пояснение: без него цифры можно понять неверно ──
  doc.setFontSize(8);
  doc.setFont('NotoSans', 'normal');
  doc.setTextColor(130, 130, 130);
  const note = doc.splitTextToSize(
    'Юнит — одно проведённое занятие целиком. Маржинальность считается только на переменных '
    + 'расходах: зарплата педагога со взносами и отпускными и комиссия эквайринга. Аренда, реклама '
    + 'и администрация сюда не входят — они покрываются уже из этой маржи. Средняя маржинальность '
    + 'средневзвешенная: считается по сумме денег всех уроков, а не как среднее двух процентов. '
    + 'Диагностики в расчёт не входят — у них своя экономика.',
    pageW - margin * 2,
  );
  doc.text(note, margin, y);

  doc.save(`marzhinalnost_uroka_${month}.pdf`);
}