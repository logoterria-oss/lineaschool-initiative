import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const FONT_PROXY = 'https://functions.poehali.dev/3f32132e-3d38-4099-90c1-0fa0d31dd012';

export interface Payment {
  id: number;
  name: string;
  parent_name: string;
  child_name: string;
  child_phone: string;
  child_email: string;
  plan: string;
  amount: number;
  paid_at: string;
  is_diag: boolean;
}

export interface PlanStat {
  plan: string;
  count: number;
  revenue: number;
  pct_count: number;
  pct_revenue: number;
}

export interface Stats {
  total_count: number;
  total_revenue: number;
  diag_count: number;
  diag_revenue: number;
  sub_count: number;
  sub_revenue: number;
  plan_breakdown: PlanStat[];
}

export type PayType = 'all' | 'diag' | 'subscription';

export const formatMoney = (n: number) =>
  n.toLocaleString('ru-RU', { minimumFractionDigits: 0 }) + ' ₽';

export const formatPaidDate = (iso: string) => {
  if (!iso) return '—';
  const normalized = iso.includes('+') || iso.endsWith('Z') ? iso : iso + 'Z';
  return new Date(normalized).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Moscow',
  });
};

export const typeLabel = (payType: PayType) => {
  if (payType === 'diag') return 'Диагностика';
  if (payType === 'subscription') return 'Абонементы';
  return 'Все покупки';
};

interface PdfOptions {
  payments: Payment[];
  stats: Stats;
  payType: PayType;
  periodLabel: string;
  fileSlug: string;
}

export async function downloadAdvanceIncomePdf({ payments, stats, payType, periodLabel, fileSlug }: PdfOptions) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

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

  // ── Шапка ──
  doc.setFillColor(34, 139, 87);
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('NotoSans', 'bold');
  doc.text(`Авансовые доходы — ${periodLabel}`, margin, 14);

  doc.setFontSize(10);
  doc.setFont('NotoSans', 'normal');
  doc.text(`Тип: ${typeLabel(payType)}   |   Сформирован: ${new Date().toLocaleDateString('ru-RU')}`, pageW - margin, 14, { align: 'right' });

  // ── Сводка ──
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont('NotoSans', 'bold');
  doc.text('Итоговая статистика', margin, 32);

  const summaryData: [string, string][] = [
    ['Всего оплат', `${stats.total_count} шт.`],
    ['Общая выручка', formatMoney(stats.total_revenue)],
    ['Диагностика', `${stats.diag_count} шт. — ${formatMoney(stats.diag_revenue)} (${stats.total_revenue ? Math.round(stats.diag_revenue / stats.total_revenue * 100) : 0}%)`],
    ['Абонементы', `${stats.sub_count} шт. — ${formatMoney(stats.sub_revenue)} (${stats.total_revenue ? Math.round(stats.sub_revenue / stats.total_revenue * 100) : 0}%)`],
  ];

  autoTable(doc, {
    startY: 35,
    head: [],
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2, font: 'NotoSans' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, textColor: [80, 80, 80] },
      1: { cellWidth: 100, textColor: [20, 20, 20] },
    },
    margin: { left: margin },
  });

  // ── Разбивка по тарифам (только абонементы) ──
  const breakdownY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  if (stats.plan_breakdown.length > 0 && payType !== 'diag') {
    doc.setFontSize(11);
    doc.setFont('NotoSans', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Разбивка по абонементам', margin, breakdownY);

    autoTable(doc, {
      startY: breakdownY + 3,
      head: [['Тариф', 'Кол-во', '% от кол-ва', 'Выручка', '% от авансовых доходов']],
      body: stats.plan_breakdown.map(p => [
        p.plan,
        String(p.count),
        `${p.pct_count}%`,
        formatMoney(p.revenue),
        `${p.pct_revenue}%`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [34, 139, 87], textColor: 255, fontStyle: 'bold', fontSize: 9, font: 'NotoSans', halign: 'center' },
      styles: { fontSize: 9, cellPadding: 3, font: 'NotoSans' },
      columnStyles: {
        0: { cellWidth: 'auto', halign: 'left' },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 38, halign: 'center' },
        4: { cellWidth: 32, halign: 'center' },
      },
      margin: { left: margin, right: margin },
    });
  }

  // ── Основная таблица платежей ──
  doc.addPage();

  doc.setFillColor(34, 139, 87);
  doc.rect(0, 0, pageW, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('NotoSans', 'bold');
  doc.text(`Список оплат — ${periodLabel} (${typeLabel(payType)})`, margin, 11);

  autoTable(doc, {
    startY: 20,
    head: [['№', 'ФИО родителя (плательщик)', 'ФИО ребёнка', 'Дата оплаты', 'Абонемент', 'Сумма']],
    body: payments.map((p, i) => [
      String(i + 1),
      p.parent_name || p.name,
      p.child_name,
      p.paid_at ? formatPaidDate(p.paid_at) : '—',
      p.plan,
      formatMoney(p.amount),
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: [34, 139, 87],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      font: 'NotoSans',
    },
    styles: { fontSize: 8.5, cellPadding: 3, overflow: 'linebreak', font: 'NotoSans' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 65 },
      2: { cellWidth: 55 },
      3: { cellWidth: 28, halign: 'center' },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: [245, 252, 248] },
    margin: { left: margin, right: margin },
    didDrawPage: (hookData) => {
      const pageCount = doc.internal.pages.length - 1;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.setFont('NotoSans', 'normal');
      doc.text(
        `Страница ${hookData.pageNumber} из ${pageCount}`,
        pageW / 2,
        pageH - 6,
        { align: 'center' }
      );
    },
  });

  // Итоговая строка внизу таблицы
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  doc.setFontSize(10);
  doc.setFont('NotoSans', 'bold');
  doc.setTextColor(34, 139, 87);
  doc.text(
    `Итого: ${payments.length} оплат на сумму ${formatMoney(stats.total_revenue)}`,
    pageW - margin,
    finalY,
    { align: 'right' }
  );

  doc.save(`avansovye_dohody_${fileSlug}_${payType}.pdf`);
}
