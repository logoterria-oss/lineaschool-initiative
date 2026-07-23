import Icon from '@/components/ui/icon';
import { usePaymentLeads } from '@/components/paymentLeads/usePaymentLeads';
import PaymentLeadCard from '@/components/paymentLeads/PaymentLeadCard';

const PaymentsStatusView = () => {
  const {
    loading, syncing, syncResult, dateFilter, setDateFilter, selectedDate, setSelectedDate,
    togglingId, deletingId, handleSync, handleDelete, handleTogglePaid, formatDate,
    filtered, paidCount, unpaidCount,
  } = usePaymentLeads();

  if (loading) {
    return <div className="text-gray-600 py-10 text-center">Загрузка...</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          <button
            onClick={() => { setDateFilter('month'); setSelectedDate(new Date().toISOString().slice(0, 7)); }}
            className={`px-4 py-1.5 font-medium transition-colors ${dateFilter === 'month' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Месяц
          </button>
          <button
            onClick={() => { setDateFilter('day'); setSelectedDate(new Date().toISOString().slice(0, 10)); }}
            className={`px-4 py-1.5 font-medium transition-colors ${dateFilter === 'day' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            День
          </button>
        </div>
        <input
          type={dateFilter === 'month' ? 'month' : 'date'}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
        />
        <button
          onClick={handleSync}
          disabled={syncing}
          className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Icon name={syncing ? 'Loader2' : 'Mail'} size={16} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Проверяю почту…' : 'Проверить оплаты'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5 text-sm text-gray-500">
        <span>{filtered.length} заявок</span>
        <span className="text-green-600">{paidCount} оплачено</span>
        <span className="text-orange-500">{unpaidCount} ожидают</span>
        {syncResult && (
          <span className="text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-1">{syncResult}</span>
        )}
      </div>

      <div className="grid gap-3">
        {filtered.map((lead) => (
          <PaymentLeadCard
            key={lead.id}
            lead={lead}
            isHead={false}
            togglingId={togglingId}
            deletingId={deletingId}
            formatDate={formatDate}
            onTogglePaid={handleTogglePaid}
            onDelete={handleDelete}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Icon name="Inbox" size={36} className="mx-auto mb-3" />
            <p>Нет заявок</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsStatusView;
