import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import {
  downloadAdvanceIncomePdf,
  formatMoney,
  formatPaidDate,
  typeLabel,
  type Payment,
  type Stats,
  type PayType,
} from '@/lib/advanceIncomePdf';

const REPORT_URL = 'https://functions.poehali.dev/479e2c37-bd7f-48dc-88f2-60dd9cb2188a';

const MONTH_NAMES: Record<string, string> = {
  '01': 'Январь', '02': 'Февраль', '03': 'Март', '04': 'Апрель',
  '05': 'Май', '06': 'Июнь', '07': 'Июль', '08': 'Август',
  '09': 'Сентябрь', '10': 'Октябрь', '11': 'Ноябрь', '12': 'Декабрь',
};

const dmy = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};

export default function AdvanceIncomeReport() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const month = params.get('month') || '';
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const payType = (params.get('type') || 'all') as PayType;
  const isRange = !!(from && to);

  const periodLabel = isRange
    ? `${dmy(from)} — ${dmy(to)}`
    : (() => {
        const [year, mon] = month.split('-');
        return `${MONTH_NAMES[mon] || mon} ${year}`;
      })();

  const fileSlug = isRange ? `${from}_${to}` : month;
  const query = isRange ? `from=${from}&to=${to}&type=${payType}` : `month=${month}&type=${payType}`;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    document.title = `Авансовые доходы — ${periodLabel}`;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${REPORT_URL}?${query}`);
        const data = await res.json();
        setPayments(data.payments || []);
        setStats(data.stats || null);
      } catch {
        setError('Не удалось загрузить отчёт. Попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleDownload = async () => {
    if (!stats) return;
    setDownloading(true);
    try {
      await downloadAdvanceIncomePdf({ payments, stats, payType, periodLabel, fileSlug });
    } catch {
      setError('Не удалось сформировать PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const pct = (part: number) => (stats?.total_revenue ? Math.round((part / stats.total_revenue) * 100) : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700 transition-colors">
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Авансовые доходы</h1>
              <p className="text-gray-500 text-sm mt-1">
                Период: {periodLabel} · {typeLabel(payType)}
              </p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            disabled={loading || downloading || !payments.length}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            <Icon name={downloading ? 'Loader2' : 'Download'} size={18} className={downloading ? 'animate-spin' : ''} />
            {downloading ? 'Формирую…' : 'Скачать PDF'}
          </button>
        </div>

        {loading && <div className="text-gray-500 py-12 text-center">Загрузка отчёта…</div>}

        {error && !loading && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        )}

        {!loading && !error && stats && payments.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500">
            За выбранный период нет оплаченных заявок.
          </div>
        )}

        {!loading && !error && stats && payments.length > 0 && (
          <>
            {/* Сводка */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">Всего оплат</div>
                <div className="text-xl font-bold text-gray-900">{stats.total_count} шт.</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">Общая выручка</div>
                <div className="text-xl font-bold text-green-600">{formatMoney(stats.total_revenue)}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">Диагностика</div>
                <div className="text-base font-semibold text-gray-900">
                  {stats.diag_count} шт. · {formatMoney(stats.diag_revenue)}
                </div>
                <div className="text-xs text-gray-400">{pct(stats.diag_revenue)}% от выручки</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">Абонементы</div>
                <div className="text-base font-semibold text-gray-900">
                  {stats.sub_count} шт. · {formatMoney(stats.sub_revenue)}
                </div>
                <div className="text-xs text-gray-400">{pct(stats.sub_revenue)}% от выручки</div>
              </div>
            </div>

            {/* Разбивка по абонементам */}
            {payType !== 'diag' && stats.plan_breakdown.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
                <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900 text-sm">
                  Разбивка по абонементам
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs">
                      <th className="text-left font-medium px-4 py-2">Тариф</th>
                      <th className="text-center font-medium px-4 py-2">Кол-во</th>
                      <th className="text-center font-medium px-4 py-2">% кол-ва</th>
                      <th className="text-right font-medium px-4 py-2">Выручка</th>
                      <th className="text-center font-medium px-4 py-2">% доходов</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.plan_breakdown.map((p, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-4 py-2 text-gray-900">{p.plan}</td>
                        <td className="px-4 py-2 text-center">{p.count}</td>
                        <td className="px-4 py-2 text-center text-gray-500">{p.pct_count}%</td>
                        <td className="px-4 py-2 text-right font-medium">{formatMoney(p.revenue)}</td>
                        <td className="px-4 py-2 text-center text-gray-500">{p.pct_revenue}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Список оплат */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900 text-sm">
                Список оплат
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs">
                      <th className="text-left font-medium px-4 py-2">№</th>
                      <th className="text-left font-medium px-4 py-2">ФИО родителя</th>
                      <th className="text-left font-medium px-4 py-2">ФИО ребёнка</th>
                      <th className="text-center font-medium px-4 py-2">Дата</th>
                      <th className="text-left font-medium px-4 py-2">Абонемент</th>
                      <th className="text-right font-medium px-4 py-2">Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => (
                      <tr key={p.id} className="border-t border-gray-100 hover:bg-green-50/40">
                        <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                        <td className="px-4 py-2 text-gray-900">{p.parent_name || p.name}</td>
                        <td className="px-4 py-2 text-gray-900">{p.child_name}</td>
                        <td className="px-4 py-2 text-center text-gray-500">{formatPaidDate(p.paid_at)}</td>
                        <td className="px-4 py-2 text-gray-700">{p.plan}</td>
                        <td className="px-4 py-2 text-right font-semibold text-gray-900">{formatMoney(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td colSpan={5} className="px-4 py-3 text-right font-semibold text-gray-700">Итого</td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">{formatMoney(stats.total_revenue)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
