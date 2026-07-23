import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { usePaymentLeads } from '@/components/paymentLeads/usePaymentLeads';

const LeadsListView = () => {
  const { loading, deduplicated, formatDate } = usePaymentLeads();
  const [search, setSearch] = useState('');

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = q
      ? deduplicated.filter((l) => l.name.toLowerCase().includes(q))
      : deduplicated;
    return [...rows].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [deduplicated, search]);

  if (loading) {
    return <div className="text-gray-600 py-10 text-center">Загрузка...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по ФИО"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
        </div>
        <span className="text-sm text-gray-500">Всего: {list.length}</span>
      </div>

      <div className="space-y-2">
        {list.map((lead) => (
          <div
            key={lead.id}
            className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3 shadow-sm"
          >
            <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Icon name="User" size={16} className="text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 truncate">{lead.name}</div>
              <div className="text-xs text-gray-500 truncate">{lead.plan}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  lead.paid_at ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}
              >
                {lead.paid_at ? 'Оплачено' : 'Ожидает'}
              </span>
              <div className="text-xs text-gray-400 mt-1">{formatDate(lead.paid_at || lead.created_at)}</div>
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Icon name="Inbox" size={36} className="mx-auto mb-3" />
            <p>Лидов не найдено</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsListView;
