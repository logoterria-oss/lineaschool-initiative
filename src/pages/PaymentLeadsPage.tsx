import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const GET_LEADS_URL = 'https://functions.poehali.dev/63eeb76f-c729-4aa3-a483-7f5b321bc4c2';
const SYNC_URL = 'https://functions.poehali.dev/af003b32-0a7b-432b-a657-9e8c28bfe436';

interface PaymentLead {
  id: number;
  name: string;
  plan: string;
  amount: number;
  order_id: string;
  created_at: string;
  paid_at: string | null;
  transaction_id: string | null;
}

export default function PaymentLeadsPage() {
  const [leads, setLeads] = useState<PaymentLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  useEffect(() => { fetchLeads(); }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await fetch(GET_LEADS_URL);
      const data = await response.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const resp = await fetch(SYNC_URL);
      const data = await resp.json();
      if (data.ok) {
        const msg = data.matched > 0
          ? `Найдено новых оплат: ${data.matched}`
          : 'Новых оплат не найдено';
        setSyncResult(msg);
        if (data.matched > 0) await fetchLeads();
      } else {
        setSyncResult('Ошибка синхронизации');
      }
    } catch {
      setSyncResult('Не удалось подключиться к почте');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const filtered = leads.filter((l) => {
    if (filter === 'paid') return !!l.paid_at;
    if (filter === 'unpaid') return !l.paid_at;
    return true;
  });

  const paidCount = leads.filter((l) => !!l.paid_at).length;
  const unpaidCount = leads.filter((l) => !l.paid_at).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Заголовок */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Заявки на оплату</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Всего: {leads.length} · Оплачено: {paidCount} · Ожидают: {unpaidCount}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {syncResult && (
              <span className="text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2">
                {syncResult}
              </span>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <Icon name={syncing ? 'Loader2' : 'Mail'} size={16} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Проверяю почту…' : 'Проверить оплаты'}
            </button>
          </div>
        </div>

        {/* Фильтр */}
        <div className="flex gap-2 mb-5">
          {(['all', 'unpaid', 'paid'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                filter === f
                  ? f === 'paid' ? 'bg-green-500 text-white border-green-500'
                    : f === 'unpaid' ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {f === 'all' ? `Все (${leads.length})` : f === 'paid' ? `Оплачено (${paidCount})` : `Ожидают (${unpaidCount})`}
            </button>
          ))}
        </div>

        {/* Список */}
        <div className="grid gap-3">
          {filtered.map((lead) => (
            <Card
              key={lead.id}
              className={`p-5 transition-shadow hover:shadow-md border-l-4 ${
                lead.paid_at ? 'border-l-green-400' : 'border-l-orange-300'
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {lead.paid_at ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        <Icon name="CheckCircle" size={12} />
                        Оплачено
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                        <Icon name="Clock" size={12} />
                        Ожидает оплаты
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="User" size={16} className="text-gray-400 flex-shrink-0" />
                    <span className="font-semibold text-gray-900">{lead.name}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">{lead.plan}</div>
                  <div className="text-xs text-gray-400">
                    Заявка: {formatDate(lead.created_at)}
                    {lead.paid_at && (
                      <span className="ml-3 text-green-600">
                        Оплата: {formatDate(lead.paid_at)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-300 mt-1">
                    {lead.order_id}
                    {lead.transaction_id && ` · TX: ${lead.transaction_id}`}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className={`text-xl font-bold ${lead.paid_at ? 'text-green-600' : 'text-gray-700'}`}>
                    {lead.amount.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>
            </Card>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Icon name="Inbox" size={36} className="mx-auto mb-3" />
              <p>Нет заявок</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}