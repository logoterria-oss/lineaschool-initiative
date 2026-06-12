import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

interface Props {
  onClose: () => void;
}

export default function RetentionReportModal({ onClose }: Props) {
  const navigate = useNavigate();
  const [rangeMode, setRangeMode] = useState<'month' | 'period'>('month');
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [dateFrom, setDateFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');

  const openReport = () => {
    if (rangeMode === 'period' && dateFrom > dateTo) {
      setError('Дата начала позже даты окончания.');
      return;
    }
    const query = rangeMode === 'period'
      ? `from=${dateFrom}&to=${dateTo}`
      : `month=${month}`;
    navigate(`/admin/report/retention?${query}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Icon name="Users" size={20} className="text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Коэффициент удержания</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Период когорты</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {(['month', 'period'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setRangeMode(m)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                    rangeMode === m
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'
                  }`}
                >
                  {m === 'month' ? 'По месяцу' : 'За период'}
                </button>
              ))}
            </div>

            {rangeMode === 'month' ? (
              <input
                type="month"
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-xs text-gray-500 mb-1">С</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <span className="block text-xs text-gray-500 mb-1">По</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            Когорта — клиенты, чья первая оплата абонемента попала в выбранный период.
          </p>

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
              onClick={openReport}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Icon name="FileText" size={16} />
              Открыть отчёт
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
