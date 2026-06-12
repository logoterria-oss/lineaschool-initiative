import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

const RETENTION_URL = 'https://functions.poehali.dev/4dc86795-cf29-4988-bffb-c2286ca74ff5';

const MONTH_NAMES: Record<string, string> = {
  '01': 'Январь', '02': 'Февраль', '03': 'Март', '04': 'Апрель',
  '05': 'Май', '06': 'Июнь', '07': 'Июль', '08': 'Август',
  '09': 'Сентябрь', '10': 'Октябрь', '11': 'Ноябрь', '12': 'Декабрь',
};

const monthLabel = (key: string) => {
  const [y, m] = key.split('-');
  return `${MONTH_NAMES[m] || m} ${y}`;
};

interface MonthRow {
  month: string;
  cohort_size: number;
  primary_eligible: number;
  primary_retained: number;
  primary_rate: number | null;
  long_term_eligible: number;
  long_term_retained: number;
  long_term_rate: number | null;
}

interface Data {
  months: MonthRow[];
  long_term_months: number;
  primary_eligible_months: number;
  long_term_eligible_months: number;
}

const Bar = ({ rate, color }: { rate: number | null; color: string }) => {
  if (rate === null) {
    return <span className="text-xs text-gray-400">рано судить</span>;
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${rate}%` }} />
      </div>
      <span className="text-sm font-medium text-gray-700 w-12 text-right">{rate}%</span>
    </div>
  );
};

export default function RetentionDynamics() {
  const navigate = useNavigate();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Удержание — динамика по месяцам';
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${RETENTION_URL}?mode=all`);
        const json = await res.json();
        setData(json);
      } catch {
        setError('Не удалось загрузить анализ. Попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const months = data?.months ?? [];
  const primaryVals = months.map(m => m.primary_rate).filter((v): v is number => v !== null);
  const longVals = months.map(m => m.long_term_rate).filter((v): v is number => v !== null);
  const avg = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700 transition-colors">
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Удержание — динамика</h1>
            <p className="text-gray-500 text-sm mt-1">Анализ по всем месяцам, где есть данные</p>
          </div>
        </div>

        {loading && <div className="text-gray-500 py-12 text-center">Загрузка анализа…</div>}
        {error && !loading && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>}

        {!loading && !error && data && (
          <>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="Info" size={18} className="text-indigo-600" />
                <h2 className="font-semibold text-indigo-900">Как считали</h2>
              </div>
              <ul className="space-y-2 text-sm text-indigo-900/90 list-disc pl-5">
                <li>
                  Для каждого месяца берём <b>когорту</b> — клиентов с первой оплатой абонемента в этом месяце.
                </li>
                <li>
                  <b>Первичное удержание</b> считаем только по тем, кто начал минимум{' '}
                  <b>{data.primary_eligible_months} мес</b> назад; <b>долгосрочное</b> — кто начал минимум{' '}
                  <b>{data.long_term_eligible_months} мес</b> назад. Остальных пропускаем — «рано судить».
                </li>
                <li>Если по месяцу нет ни одного клиента, по которому можно судить — метрика не считается.</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="text-xs text-gray-500 mb-1">Среднее первичное удержание</div>
                <div className="text-3xl font-bold text-green-600">{avg(primaryVals) ?? '—'}%</div>
                <div className="text-xs text-gray-400 mt-1">по {primaryVals.length} мес с данными</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="text-xs text-gray-500 mb-1">Среднее долгосрочное удержание</div>
                <div className="text-3xl font-bold text-amber-600">{avg(longVals) ?? '—'}%</div>
                <div className="text-xs text-gray-400 mt-1">по {longVals.length} мес с данными</div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900 text-sm">
                Динамика по месяцам ({months.length})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs">
                      <th className="text-left font-medium px-4 py-2">Месяц</th>
                      <th className="text-center font-medium px-4 py-2">Когорта</th>
                      <th className="text-left font-medium px-4 py-2 min-w-[180px]">Первичное</th>
                      <th className="text-left font-medium px-4 py-2 min-w-[180px]">Долгосрочное</th>
                    </tr>
                  </thead>
                  <tbody>
                    {months.map((m) => (
                      <tr key={m.month} className="border-t border-gray-100 hover:bg-gray-50/60">
                        <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">{monthLabel(m.month)}</td>
                        <td className="px-4 py-3 text-center text-gray-700">{m.cohort_size}</td>
                        <td className="px-4 py-3">
                          <Bar rate={m.primary_rate} color="bg-green-500" />
                          {m.primary_rate !== null && (
                            <div className="text-[11px] text-gray-400 mt-0.5">{m.primary_retained} из {m.primary_eligible}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Bar rate={m.long_term_rate} color="bg-amber-500" />
                          {m.long_term_rate !== null && (
                            <div className="text-[11px] text-gray-400 mt-0.5">{m.long_term_retained} из {m.long_term_eligible}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
