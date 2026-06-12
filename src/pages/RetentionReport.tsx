import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

const RETENTION_URL = 'https://functions.poehali.dev/4dc86795-cf29-4988-bffb-c2286ca74ff5';

const MONTH_NAMES: Record<string, string> = {
  '01': 'Январь', '02': 'Февраль', '03': 'Март', '04': 'Апрель',
  '05': 'Май', '06': 'Июнь', '07': 'Июль', '08': 'Август',
  '09': 'Сентябрь', '10': 'Октябрь', '11': 'Ноябрь', '12': 'Декабрь',
};

const dmy = (iso: string) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
};

interface Client {
  name: string;
  first_paid_at: string | null;
  last_paid_at: string | null;
  purchases: number;
  total_months: number;
  primary_retained: boolean;
  long_term_retained: boolean;
}

interface Stats {
  cohort_size: number;
  primary_retained: number;
  primary_rate: number;
  long_term_retained: number;
  long_term_rate: number;
  long_term_months: number;
}

export default function RetentionReport() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const month = params.get('month') || '';
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const isRange = !!(from && to);

  const periodLabel = isRange
    ? `${dmy(from)} — ${dmy(to)}`
    : (() => {
        const [year, mon] = month.split('-');
        return `${MONTH_NAMES[mon] || mon} ${year}`;
      })();

  const query = isRange ? `from=${from}&to=${to}` : `month=${month}`;

  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = `Коэффициент удержания — ${periodLabel}`;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${RETENTION_URL}?${query}`);
        const data = await res.json();
        setClients(data.clients || []);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700 transition-colors">
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Коэффициент удержания</h1>
            <p className="text-gray-500 text-sm mt-1">Когорта клиентов за период: {periodLabel}</p>
          </div>
        </div>

        {loading && <div className="text-gray-500 py-12 text-center">Загрузка отчёта…</div>}

        {error && !loading && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        )}

        {!loading && !error && stats && (
          <>
            {/* Как считали */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="Info" size={18} className="text-indigo-600" />
                <h2 className="font-semibold text-indigo-900">Как считали</h2>
              </div>
              <ul className="space-y-2 text-sm text-indigo-900/90 list-disc pl-5">
                <li>
                  <b>Когорта</b> — клиенты, чья <b>первая</b> оплата абонемента (диагностика не считается)
                  попала в выбранный период. Один клиент — это уникальное ФИО (объединяем
                  опечатки и разный порядок слов).
                </li>
                <li>
                  <b>Первичное удержание</b> — доля клиентов когорты, у которых есть <b>хотя бы ещё одна</b>{' '}
                  оплата абонемента позже первой (купили второй абонемент).
                </li>
                <li>
                  <b>Долгосрочное удержание</b> — доля клиентов когорты, у которых <b>сумма длительностей
                  всех купленных абонементов</b> составляет <b>{stats.long_term_months}+ месяцев</b>.
                  Длительность берём из названия тарифа (например «3 месяца» = 3). Так перерывы
                  на каникулы между абонементами не уменьшают итоговый срок.
                </li>
                <li>
                  Все расчёты — только по нашей истории оплат. Источник: подтверждённые платежи.
                </li>
              </ul>
            </div>

            {/* Метрики */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="text-xs text-gray-500 mb-1">Размер когорты</div>
                <div className="text-3xl font-bold text-gray-900">{stats.cohort_size}</div>
                <div className="text-xs text-gray-400 mt-1">клиентов с первой оплатой в периоде</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="text-xs text-gray-500 mb-1">Первичное удержание</div>
                <div className="text-3xl font-bold text-green-600">{stats.primary_rate}%</div>
                <div className="text-xs text-gray-400 mt-1">
                  купили 2-й абонемент: {stats.primary_retained} из {stats.cohort_size}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="text-xs text-gray-500 mb-1">Долгосрочное удержание</div>
                <div className="text-3xl font-bold text-amber-600">{stats.long_term_rate}%</div>
                <div className="text-xs text-gray-400 mt-1">
                  занимаются 6+ мес: {stats.long_term_retained} из {stats.cohort_size}
                </div>
              </div>
            </div>

            {/* Таблица клиентов */}
            {clients.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500">
                За выбранный период нет клиентов с первой оплатой абонемента.
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900 text-sm">
                  Клиенты когорты ({clients.length})
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs">
                        <th className="text-left font-medium px-4 py-2">Клиент</th>
                        <th className="text-center font-medium px-4 py-2">1-я оплата</th>
                        <th className="text-center font-medium px-4 py-2">Посл. оплата</th>
                        <th className="text-center font-medium px-4 py-2">Покупок</th>
                        <th className="text-center font-medium px-4 py-2">Сумма мес.</th>
                        <th className="text-center font-medium px-4 py-2">Первичное</th>
                        <th className="text-center font-medium px-4 py-2">Долгосрочное</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((c, i) => (
                        <tr key={i} className="border-t border-gray-100 hover:bg-gray-50/60">
                          <td className="px-4 py-2 text-gray-900">{c.name}</td>
                          <td className="px-4 py-2 text-center text-gray-500">{dmy(c.first_paid_at || '')}</td>
                          <td className="px-4 py-2 text-center text-gray-500">{dmy(c.last_paid_at || '')}</td>
                          <td className="px-4 py-2 text-center font-medium">{c.purchases}</td>
                          <td className="px-4 py-2 text-center text-gray-600">{c.total_months}</td>
                          <td className="px-4 py-2 text-center">
                            {c.primary_retained
                              ? <Icon name="Check" size={16} className="text-green-600 inline" />
                              : <Icon name="Minus" size={16} className="text-gray-300 inline" />}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {c.long_term_retained
                              ? <Icon name="Check" size={16} className="text-amber-600 inline" />
                              : <Icon name="Minus" size={16} className="text-gray-300 inline" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}