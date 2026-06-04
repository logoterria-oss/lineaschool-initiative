import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Icon from '@/components/ui/icon';

const REPORT_URL = 'https://functions.poehali.dev/479e2c37-bd7f-48dc-88f2-60dd9cb2188a';

const MONTH_NAMES: Record<string, string> = {
  '01': 'Январь', '02': 'Февраль', '03': 'Март', '04': 'Апрель',
  '05': 'Май', '06': 'Июнь', '07': 'Июль', '08': 'Август',
  '09': 'Сентябрь', '10': 'Октябрь', '11': 'Ноябрь', '12': 'Декабрь',
};

interface Payment {
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

interface PlanStat {
  plan: string;
  count: number;
  revenue: number;
  pct_count: number;
  pct_revenue: number;
}

interface Stats {
  total_count: number;
  total_revenue: number;
  diag_count: number;
  diag_revenue: number;
  sub_count: number;
  sub_revenue: number;
  plan_breakdown: PlanStat[];
}

interface Props {
  onClose: () => void;
}

export default function PaymentReportModal({ onClose }: Props) {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [payType, setPayType] = useState<'all' | 'diag' | 'subscription'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Moscow' });

  const formatMoney = (n: number) =>
    n.toLocaleString('ru-RU', { minimumFractionDigits: 0 }) + ' ₽';

  const monthLabel = () => {
    const [year, mon] = month.split('-');
    return `${MONTH_NAMES[mon] || mon} ${year}`;
  };

  const typeLabel = () => {
    if (payType === 'diag') return 'Диагностика';
    if (payType === 'subscription') return 'Абонементы';
    return 'Все покупки';
  };

  const generatePdf = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${REPORT_URL}?month=${month}&type=${payType}`);
      const data = await res.json();
      const payments: Payment[] = data.payments || [];
      const stats: Stats = data.stats;

      if (payments.length === 0) {
        setError('За выбранный период нет оплаченных заявок.');
        setLoading(false);
        return;
      }

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // Грузим Noto Sans через наш бэкенд-прокси (jsDelivr → бэкенд → PDF)
      const FONT_PROXY = 'https://functions.poehali.dev/3f32132e-3d38-4099-90c1-0fa0d31dd012';
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

      // ── Шапка ──────────────────────────────────────────────────────────────
      doc.setFillColor(34, 139, 87);
      doc.rect(0, 0, pageW, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('NotoSans', 'bold');
      doc.text(`Отчёт по оплатам — ${monthLabel()}`, margin, 14);

      doc.setFontSize(10);
      doc.setFont('NotoSans', 'normal');
      doc.text(`Тип: ${typeLabel()}   |   Сформирован: ${new Date().toLocaleDateString('ru-RU')}`, pageW - margin, 14, { align: 'right' });

      // ── Сводка ─────────────────────────────────────────────────────────────
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

      // ── Разбивка по тарифам (только абонементы) ────────────────────────────
      const breakdownY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

      if (stats.plan_breakdown.length > 0 && payType !== 'diag') {
        doc.setFontSize(11);
        doc.setFont('NotoSans', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text('Разбивка по абонементам', margin, breakdownY);

        autoTable(doc, {
          startY: breakdownY + 3,
          head: [['Тариф', 'Кол-во', '% от кол-ва', 'Выручка', '% от дохода']],
          body: stats.plan_breakdown.map(p => [
            p.plan,
            String(p.count),
            `${p.pct_count}%`,
            formatMoney(p.revenue),
            `${p.pct_revenue}%`,
          ]),
          theme: 'striped',
          headStyles: { fillColor: [34, 139, 87], textColor: 255, fontStyle: 'bold', fontSize: 9, font: 'NotoSans' },
          styles: { fontSize: 9, cellPadding: 3, font: 'NotoSans' },
          columnStyles: {
            0: { cellWidth: 90 },
            1: { cellWidth: 22, halign: 'center' },
            2: { cellWidth: 28, halign: 'center' },
            3: { cellWidth: 35, halign: 'right' },
            4: { cellWidth: 28, halign: 'center' },
          },
          margin: { left: margin },
        });
      }

      // ── Основная таблица платежей ───────────────────────────────────────────
      doc.addPage();

      doc.setFillColor(34, 139, 87);
      doc.rect(0, 0, pageW, 16, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('NotoSans', 'bold');
      doc.text(`Список оплат — ${monthLabel()} (${typeLabel()})`, margin, 11);

      autoTable(doc, {
        startY: 20,
        head: [['№', 'ФИО родителя (плательщик)', 'ФИО ребёнка', 'Дата оплаты', 'Абонемент', 'Сумма']],
        body: payments.map((p, i) => [
          String(i + 1),
          p.parent_name || p.name,
          p.child_name,
          p.paid_at ? formatDate(p.paid_at) : '—',
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
          // Нумерация страниц
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

      const fileName = `otchet_oplaty_${month}_${payType}.pdf`;
      doc.save(fileName);
    } catch (e) {
      console.error(e);
      setError('Не удалось сформировать отчёт. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icon name="FileText" size={20} className="text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Составить отчёт</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Месяц</label>
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Тип покупки</label>
            <div className="grid grid-cols-3 gap-2">
              {(['all', 'diag', 'subscription'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setPayType(t)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                    payType === t
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                  }`}
                >
                  {t === 'all' ? 'Все' : t === 'diag' ? 'Диагностика' : 'Абонементы'}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="pt-1 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={generatePdf}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Icon name={loading ? 'Loader2' : 'Download'} size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Формирую…' : 'Скачать PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}