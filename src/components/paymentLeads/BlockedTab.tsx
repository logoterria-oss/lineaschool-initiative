import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { BlockedPayment } from './types';

interface BlockedTabProps {
  blocked: BlockedPayment[];
  isHead: boolean;
  unblockingId: number | null;
  formatDate: (s: string) => string;
  onUnblock: (item: BlockedPayment) => void;
}

export default function BlockedTab({ blocked, isHead, unblockingId, formatDate, onUnblock }: BlockedTabProps) {
  return (
    <div className="grid gap-3">
      <p className="text-sm text-gray-500 mb-1">
        Эти платежи удалены вручную и больше не появляются в отчётах. Автосинхронизация с почтой банка не будет их восстанавливать. Нажмите «Вернуть», если платёж заблокирован по ошибке.
      </p>
      {blocked.map((item) => (
        <Card key={item.id} className="p-5 border-l-4 border-l-red-300">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="User" size={16} className="text-gray-400 flex-shrink-0" />
                <span className="font-semibold text-gray-900">{item.name || '—'}</span>
              </div>
              {item.blocked_at && (
                <div className="text-xs text-gray-400">Заблокирован: {formatDate(item.blocked_at)}</div>
              )}
              <div className="text-xs text-gray-300 mt-1">
                {item.order_id}
                {item.transaction_id && ` · TX: ${item.transaction_id}`}
              </div>
            </div>
            {isHead && (
              <button
                onClick={() => onUnblock(item)}
                disabled={unblockingId === item.id}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors flex-shrink-0"
              >
                <Icon name={unblockingId === item.id ? 'Loader2' : 'Undo2'} size={14} className={unblockingId === item.id ? 'animate-spin' : ''} />
                Вернуть
              </button>
            )}
          </div>
        </Card>
      ))}
      {blocked.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Icon name="ShieldCheck" size={36} className="mx-auto mb-3" />
          <p>Заблокированных платежей нет</p>
        </div>
      )}
    </div>
  );
}
