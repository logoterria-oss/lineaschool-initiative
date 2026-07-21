import Icon from '@/components/ui/icon';
import PaymentReportModal from '@/components/PaymentReportModal';
import ManualPaymentModal from '@/components/ManualPaymentModal';
import { usePaymentLeads } from '@/components/paymentLeads/usePaymentLeads';
import PaymentLeadCard from '@/components/paymentLeads/PaymentLeadCard';
import BlockedTab from '@/components/paymentLeads/BlockedTab';

const PaymentsView = () => {
  const {
    isHead, loading, syncing, syncResult, dateFilter, setDateFilter, selectedDate,
    setSelectedDate, showReport, setShowReport, showManual, setShowManual, deletingId,
    togglingId, tab, setTab, blocked, unblockingId, handleUnblock, handleSync, handleDelete,
    handleTogglePaid, formatDate, deduplicated, filtered, paidCount, unpaidCount, fetchLeads,
  } = usePaymentLeads(true);

  if (loading) {
    return <div className="text-gray-600 py-10 text-center">Загрузка...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-gray-500 text-sm">Всего заявок: {deduplicated.length}</p>
        <div className="flex items-center gap-3 flex-wrap">
          {syncResult && (
            <span className="text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2">
              {syncResult}
            </span>
          )}
          {isHead && (
            <>
              <button
                onClick={() => setShowManual(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
              >
                <Icon name="Plus" size={16} />
                Добавить оплату
              </button>
              <button
                onClick={() => setShowReport(true)}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
              >
                <Icon name="FileText" size={16} />
                Составить отчёт
              </button>
            </>
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

      <div className="flex gap-2 mb-5 border-b border-gray-200">
        <button
          onClick={() => setTab('active')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'active' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Оплаты
        </button>
        <button
          onClick={() => setTab('blocked')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${tab === 'blocked' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Icon name="ShieldOff" size={15} />
          Заблокированные
          {blocked.length > 0 && (
            <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5 font-semibold">{blocked.length}</span>
          )}
        </button>
      </div>

      {tab === 'blocked' ? (
        <BlockedTab blocked={blocked} isHead={isHead} unblockingId={unblockingId} formatDate={formatDate} onUnblock={handleUnblock} />
      ) : (
        <>
          <div className="flex items-center gap-3 mb-5 flex-wrap">
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
            <span className="text-sm text-gray-500">
              {filtered.length} заявок · {paidCount} оплачено · {unpaidCount} ожидают
            </span>
          </div>

          <div className="grid gap-3">
            {filtered.map((lead) => (
              <PaymentLeadCard
                key={lead.id}
                lead={lead}
                isHead={isHead}
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
        </>
      )}

      {showReport && <PaymentReportModal onClose={() => setShowReport(false)} />}
      {showManual && <ManualPaymentModal onClose={() => setShowManual(false)} onSaved={fetchLeads} />}
    </div>
  );
};

export default PaymentsView;