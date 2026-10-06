import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { UnitMarginResult, UnitMarginResults, UnitMonthTotals } from './unitMarginModel';
import { monthLabel } from './unitMarginModel';
import type { UnitFactSide } from './unitMarginApi';

const FONT_PROXY = 'https://functions.poehali.dev/3f32132e-3d38-4099-90c1-0fa0d31dd012';

type Rgb = [number, number, number];

/** Фирменный зелёный — как в остальных отчётах школы. */
const BRAND: Rgb = [34, 139, 87];
const RED: Rgb = [194, 65, 55];
const GREY: Rgb = [110, 110, 110];

const money2 = (n: number) =>
  `${(Math.round(n * 100) / 100).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₽`;

const money = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₽`;
const percent = (n: number) => `${Math.round(n * 100) / 100}%`;

interface PdfOptions {
  result: UnitMarginResults;
  totals: UnitMonthTotals | null;
  month: string;
  individualFact?: UnitFactSide;
  groupFact?: UnitFactSide;
}

/**
 * PDF «Маржинальность урока» — повторяет то, что руководитель видит на
 * экране: полный разбор индивидуального занятия, группового и итог месяца
 * со средневзвешенной маржинальностью.
 *
 * Все формулы переносим как есть: документ должен позволять пересчитать
 * каждую цифру руками, не открывая систему.
 */
export async function downloadUnitMarginPdf({
  result, totals, month, individualFact, groupFact,
}: PdfOptions) {
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
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;

  const lastY = () =>
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

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

  /** Блок одной формы занятий: выручка, расходы построчно, маржа. */
  const renderSide = (
    res: UnitMarginResult,
    fact: UnitFactSide | undefined,
    title: string,
    subtitle: string,
    startY: number,
  ) => {
    doc.setFontSize(12);
    doc.setFont('NotoSans', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(title, margin, startY);

    doc.setFontSize(8.5);
    doc.setFont('NotoSans', 'normal');
    doc.setTextColor(...GREY);
    doc.text(subtitle, margin, startY + 4.5);

    // Главные цифры блока — маржинальность и маржа
    doc.setFontSize(9);
    doc.setTextColor(...GREY);
    doc.text('Маржинальность', pageW - margin - 42, startY, { align: 'right' });
    doc.text('Маржа с занятия', pageW - margin, startY, { align: 'right' });

    const positive = res.margin >= 0;
    doc.setFontSize(14);
    doc.setFont('NotoSans', 'bold');
    doc.setTextColor(...(positive ? BRAND : RED));
    doc.text(percent(res.marginPercent), pageW - margin - 42, startY + 6.5, { align: 'right' });
    doc.text(money2(res.margin), pageW - margin, startY + 6.5, { align: 'right' });

    // Разбор: выручка → расходы построчно → маржа
    const body: (string | { content: string; styles?: object })[][] = [];

    body.push(['Выручка занятия', res.revenueFormula, money2(res.revenue)]);
    res.costRows.forEach((r) => {
      body.push([`- ${r.label}`, r.formula, `-${money2(r.value)}`]);
    });
    body.push(['= Переменные расходы', '', money2(res.costTotal)]);
    body.push([
      '= Маржинальная прибыль',
      `${money2(res.revenue)} - ${money2(res.costTotal)}`,
      `${money2(res.margin)} (${percent(res.marginPercent)})`,
    ]);

    const marginRowIdx = 1 + res.costRows.length + 1;

    autoTable(doc, {
      startY: startY + 8,
      head: [],
      body,
      theme: 'plain',
      styles: { fontSize: 8.5, cellPadding: 1.8, font: 'NotoSans' },
      columnStyles: {
        0: { cellWidth: 52, textColor: [40, 40, 40] },
        1: { cellWidth: 'auto', textColor: [150, 150, 150], fontSize: 7.5 },
        2: { cellWidth: 40, halign: 'right', textColor: [20, 20, 20] },
      },
      margin: { left: margin, right: margin },
      didParseCell: (d) => {
        if (d.section !== 'body') return;
        const label = String((d.row.raw as string[])[0] ?? '');
        // Итоговые строки выделяем: по ним читают результат
        if (label.startsWith('=') || label.startsWith('Выручка')) {
          d.cell.styles.fontStyle = 'bold';
        }
        if (d.row.index === marginRowIdx) {
          d.cell.styles.textColor = positive ? BRAND : RED;
          d.cell.styles.fillColor = [244, 250, 246];
        }
      },
    });

    let y = lastY() + 4;

    // Служебные показатели — как в карточке на экране
    doc.setFontSize(7.5);
    doc.setFont('NotoSans', 'normal');
    doc.setTextColor(...GREY);
    const isGroup = res.form === 'group';
    const extra = isGroup
      ? `Нужно детей на занятии для нуля: ${res.breakEvenClients} (сейчас ${res.clientsPerLesson}).`
      : `Безубыточная цена занятия: ${money2(res.breakEvenRevenue)}.`;
    doc.text(
      `${extra}  Фонд оплаты труда в выручке: ${percent(res.payrollShare)}.`,
      margin, y,
    );
    y += 4;

    if (fact) {
      const factLine = `Факт месяца: ${fact.lessons} занятий, ${fact.students} учеников, `
        + `списано ${money(fact.revenue)}. Средняя оплата места — ${money2(res.pricePerClient)}`
        + (isGroup
          ? `, оплаченная наполняемость — ${res.clientsPerLesson} чел. (физически ${fact.avg_present_size}).`
          : '.');
      const lines = doc.splitTextToSize(factLine, pageW - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 3.2;

      if (fact.missed_units > 0) {
        const missLine = `Пропуски: ${fact.missed_units} из ${fact.units} мест, из них `
          + `${fact.missed_charged} со списанием — принесли ${money(fact.missed_charged_revenue)} `
          + `(${fact.missed_revenue_share}% выручки), ${fact.missed_free} без списания.`;
        const ml = doc.splitTextToSize(missLine, pageW - margin * 2);
        doc.text(ml, margin, y);
        y += ml.length * 3.2;
      }
    }

    return y;
  };

  // ── Индивидуальное занятие ──
  let y = renderSide(
    result.individual, individualFact,
    'Индивидуальное занятие', 'юнит — одно проведённое занятие', 34,
  );

  // ── Групповое занятие ──
  y = renderSide(
    result.group, groupFact,
    'Групповое занятие', 'юнит — одно проведённое занятие со всей группой',
    y + 8,
  );

  // ── Средняя маржинальность за месяц ──
  if (totals) {
    // Итог месяца — главный вывод, разрывать его между страницами нельзя.
    // Блоку нужно ~62 мм: шапка (21) + до 8 строк таблицы (~37) + отступ.
    // Пояснение внизу при нехватке места перенесётся само.
    const needed = 62;
    if (y + needed > pageH - 10) {
      doc.addPage();
      y = 20;
    } else {
      y += 10;
    }

    doc.setFillColor(...BRAND);
    doc.rect(margin, y - 5, pageW - margin * 2, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('NotoSans', 'bold');
    doc.text('Средняя маржинальность за месяц', margin + 4, y + 1);
    doc.setFontSize(8);
    doc.setFont('NotoSans', 'normal');
    doc.text(
      `все уроки ${monthLabel(month)} вместе — ${totals.lessons} занятий`,
      margin + 4, y + 6,
    );
    doc.setFontSize(17);
    doc.setFont('NotoSans', 'bold');
    doc.text(percent(totals.marginPercent), pageW - margin - 4, y + 5, { align: 'right' });

    y += 21;

    const totalsBody: string[][] = [
      [
        'Проведено занятий',
        `инд. ${totals.individualLessons} + гр. ${totals.groupLessons}`,
        String(totals.lessons),
      ],
      [
        'Выручка месяца',
        `${money2(result.individual.revenue)} × ${totals.individualLessons} + ${money2(result.group.revenue)} × ${totals.groupLessons}`,
        money(totals.revenue),
      ],
      ['- Переменные расходы', '', `-${money(totals.costTotal)}`],
      [
        '= Маржинальная прибыль',
        `${money(totals.revenue)} - ${money(totals.costTotal)}`,
        `${money(totals.margin)} (${percent(totals.marginPercent)})`,
      ],
    ];

    const share = (v: number) =>
      totals.margin !== 0 ? Math.round((v / totals.margin) * 100) : 0;
    totalsBody.push([
      'Вклад индивидуальных',
      `${totals.individualLessons} зан. · ${share(totals.individualMargin)}% маржи`,
      money(totals.individualMargin),
    ]);
    totalsBody.push([
      'Вклад групповых',
      `${totals.groupLessons} зан. · ${share(totals.groupMargin)}% маржи`,
      money(totals.groupMargin),
    ]);

    autoTable(doc, {
      startY: y,
      head: [],
      body: totalsBody,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2, font: 'NotoSans' },
      columnStyles: {
        0: { cellWidth: 52, textColor: [40, 40, 40] },
        1: { cellWidth: 'auto', textColor: [150, 150, 150], fontSize: 7.5 },
        2: { cellWidth: 40, halign: 'right', textColor: [20, 20, 20] },
      },
      margin: { left: margin, right: margin },
      // Итоговую таблицу между страницами не рвём — читают её целиком
      rowPageBreak: 'avoid',
      didParseCell: (d) => {
        if (d.section !== 'body') return;
        const label = String((d.row.raw as string[])[0] ?? '');
        if (label.startsWith('=') || label.startsWith('Выручка')) {
          d.cell.styles.fontStyle = 'bold';
        }
        if (label === '= Маржинальная прибыль') {
          d.cell.styles.textColor = totals.margin >= 0 ? BRAND : RED;
          d.cell.styles.fillColor = [244, 250, 246];
        }
      },
    });

    y = lastY() + 6;
  }

  // ── Пояснение: без него цифры можно понять неверно ──
  doc.setFontSize(7.5);
  doc.setFont('NotoSans', 'normal');
  doc.setTextColor(140, 140, 140);
  // Пояснение занимает ~22 мм — если не влезает, уносим на новую страницу
  if (y > pageH - 26) {
    doc.addPage();
    y = 20;
  }
  const note = doc.splitTextToSize(
    'Юнит — одно проведённое занятие целиком: педагогу платят один раз за урок независимо от '
    + 'числа детей в группе. Маржинальность считается только на переменных расходах — зарплата '
    + 'педагога со взносами и отпускными и комиссия эквайринга. Аренда, реклама и администрация '
    + 'сюда не входят: они покрываются уже из этой маржи. Наполняемость — оплаченная: прогул со '
    + 'списанием приносит деньги, а отработка и уважительный пропуск нет. Средняя маржинальность '
    + 'средневзвешенная: считается по сумме денег всех уроков, а не как среднее двух процентов. '
    + 'Диагностики в расчёт не входят — у них своя экономика.',
    pageW - margin * 2,
  );
  doc.text(note, margin, y);

  doc.save(`marzhinalnost_uroka_${month}.pdf`);
}