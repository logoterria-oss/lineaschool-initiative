import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { PaymentLead } from './types';

interface PaymentLeadCardProps {
  lead: PaymentLead;
  isHead: boolean;
  togglingId: number | null;
  deletingId: number | null;
  formatDate: (s: string) => string;
  onTogglePaid: (lead: PaymentLead) => void;
  onDelete: (lead: PaymentLead) => void;
}

export default function PaymentLeadCard({ lead, isHead, togglingId, deletingId, formatDate, onTogglePaid, onDelete }: PaymentLeadCardProps) {
  return (
    <Card
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
            {lead.source === 'manual' && (
              <span className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                <Icon name="PencilLine" size={12} />
                Внесено вручную
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

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={`text-xl font-bold ${lead.paid_at ? 'text-green-600' : 'text-gray-700'}`}>
            {lead.amount.toLocaleString('ru-RU')} ₽
          </span>
          {isHead && (
            <button
              onClick={() => onTogglePaid(lead)}
              disabled={togglingId === lead.id}
              className={`flex items-center gap-1 text-xs disabled:opacity-50 transition-colors ${
                lead.paid_at ? 'text-orange-500 hover:text-orange-700' : 'text-green-600 hover:text-green-800'
              }`}
            >
              <Icon
                name={togglingId === lead.id ? 'Loader2' : lead.paid_at ? 'RotateCcw' : 'CheckCircle'}
                size={14}
                className={togglingId === lead.id ? 'animate-spin' : ''}
              />
              {lead.paid_at ? 'В ожидание' : 'Отметить оплаченной'}
            </button>
          )}
          {isHead && (
            <button
              onClick={() => onDelete(lead)}
              disabled={deletingId === lead.id}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
            >
              <Icon name={deletingId === lead.id ? 'Loader2' : 'Trash2'} size={14} className={deletingId === lead.id ? 'animate-spin' : ''} />
              Удалить
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
