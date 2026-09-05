import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import FactIncomeTable from '@/components/factIncome/FactIncomeTable';
import {
  FactIncomeData,
  MARK_LABEL,
  MARK_STYLE,
  fetchFactIncome,
  formatMoney,
} from '@/lib/factIncomeApi';

const FactIncomeReport = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const year = Number(params.get('year')) || 2026;

  const [data, setData] = useState<FactIncomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        setData(await fetchFactIncome(year, refresh));
      } catch {
        setError('Не удалось загрузить отчёт. Попробуйте ещё раз.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [year],
  );

  useEffect(() => {
    document.title = `Фактические доходы — ${year - 1}/${year}`;
    load();
  }, [load, year]);

  const rows = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.rows;
    return data.rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [data, search]);

  const yearTotal = useMemo(
    () => (data ? data.totals.reduce((s, t) => s + t.total, 0) : 0),
    [data],
  );

  const exportCsv = () => {
    if (!data) return;
    const head = ['№', 'ФИ ученика'];
    data.months.forEach((m) => head.push(`${m} кол-во`, `${m} руб/урок`, `${m} стоимость`));
    const lines = [head.join(';')];
    data.rows.forEach((r, i) => {
      const cells: string[] = [String(i + 1), r.name];
      r.cells.forEach((c) => {
        cells.push(
          String(c.lessons + (c.diag_amount ? c.diag_count : 0)),
          c.prices.map((p) => p.price).join(' | '),
          String(c.amount),
        );
      });
      lines.push(cells.join(';'));
    });
    const totals = ['', 'ИТОГО'];
    data.totals.forEach((t) => totals.push('', '', String(t.total)));
    lines.push(totals.join(';'));

    const blob = new Blob([`\uFEFF${lines.join('\n')}`], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Факт_${year - 1}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1800px] mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-200 text-gray-500"
            title="Назад"
          >
            <Icon name="ArrowLeft" size={20} />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Фактические доходы</h1>

          <div className="ml-auto flex items-center gap-2">
            <select
              value={year}
              onChange={(e) => setParams({ year: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  Учебный год {y - 1}/{y}
                </option>
              ))}
            </select>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              <Icon name="RefreshCw" size={16} className={refreshing ? 'animate-spin' : ''} />
              Пересчитать
            </button>
            <button
              onClick={exportCsv}
              disabled={!data}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50"
            >
              <Icon name="Download" size={16} />
              Выгрузить
            </button>
          </div>
        </div>

        <p className="text-gray-500 mb-5 ml-11">
          Сентябрь {year - 1} — август {year} · заработано по проведённым занятиям
        </p>

        {loading ? (
          <div className="flex items-center gap-3 text-gray-500 py-20 justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-green-500 animate-spin" />
            Собираем данные из CRM
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>
        ) : data ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-sm text-gray-500">Доход за год</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatMoney(yearTotal)} ₽
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-sm text-gray-500">Учеников в году</div>
                <div className="text-2xl font-bold">{data.rows.length}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-sm text-gray-500">Новых за год</div>
                <div className="text-2xl font-bold text-green-600">
                  +{data.totals.reduce((s, t) => s + t.new, 0)}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-sm text-gray-500">Ушло за год</div>
                <div className="text-2xl font-bold text-red-600">
                  −{data.totals.reduce((s, t) => s + t.left, 0)}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-3">
              <div className="relative">
                <Icon
                  name="Search"
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск по ученику"
                  className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-64 bg-white"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                {(Object.keys(MARK_LABEL) as (keyof typeof MARK_LABEL)[]).map((k) => (
                  <span key={k} className="flex items-center gap-1.5">
                    <span className={`inline-block w-4 h-4 rounded ${MARK_STYLE[k]} border border-gray-300`} />
                    {MARK_LABEL[k]}
                  </span>
                ))}
              </div>
            </div>

            <FactIncomeTable rows={rows} totals={data.totals} months={data.months} />

            {data.unmatched_diag.length > 0 && (
              <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <Icon name="TriangleAlert" size={18} />
                  Оплаченные диагностики без ученика в CRM ({data.unmatched_diag.length})
                </div>
                <div className="text-sm text-amber-800 space-y-1">
                  {data.unmatched_diag.map((d) => (
                    <div key={`${d.month}-${d.name}`}>
                      {d.month} · {d.name} · {formatMoney(d.amount)} ₽
                    </div>
                  ))}
                </div>
                <div className="text-xs text-amber-700 mt-2">
                  Эти суммы в таблицу не попали: в оплате указано имя, которого нет в карточках CRM.
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default FactIncomeReport;
