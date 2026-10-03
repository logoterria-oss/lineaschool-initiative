import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { DashboardData, FmNotification } from '@/lib/finmodelApi';
import { NOTIF_TYPE_LABEL } from './dashboardUtils';

interface Props {
  data: DashboardData;
  onAction: (op: 'dismiss' | 'snooze' | 'read' | 'restore', id?: number) => Promise<void>;
  onGo: (target: string) => void;
  onCloseMonth: () => void;
}

const PRIORITY: Record<string, { label: string; cls: string; dot: string }> = {
  high: { label: 'высокий', cls: 'border-rose-200 bg-rose-50/60', dot: 'bg-rose-500' },
  medium: { label: 'средний', cls: 'border-amber-200 bg-amber-50/60', dot: 'bg-amber-500' },
  low: { label: 'низкий', cls: 'border-gray-200 bg-gray-50', dot: 'bg-gray-400' },
};

const DashboardNotifications = ({ data, onAction, onGo, onCloseMonth }: Props) => {
  const [busy, setBusy] = useState<number | 'restore' | null>(null);
  const run = async (key: number | 'restore', fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };
  const date = (n: FmNotification) => new Date(n.created_at).toLocaleDateString('ru-RU');

  return (
    <div id="fm-notifications" className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Icon name="Bell" size={18} className="text-gray-500" />
        <h3 className="font-semibold text-gray-900 flex-1">Уведомления</h3>
        {data.hidden_notifications > 0 && (
          <button
            disabled={busy !== null}
            onClick={() => run('restore', () => onAction('restore'))}
            className="text-xs text-gray-500 hover:text-gray-800 underline"
          >
            показать скрытые и отложенные ({data.hidden_notifications})
          </button>
        )}
      </div>
      {data.notifications.length === 0 ? (
        <div className="text-sm text-emerald-700 flex items-center gap-2">
          <Icon name="CircleCheck" size={16} /> Всё в порядке — критичных событий нет
        </div>
      ) : (
        <div className="space-y-2">
          {data.notifications.map((n) => {
            const p = PRIORITY[n.priority] || PRIORITY.low;
            return (
              <div
                key={n.id}
                className={`rounded-lg border p-3 ${p.cls} ${n.read_at ? 'opacity-80' : ''}`}
                onMouseEnter={() => !n.read_at && onAction('read', n.id)}
              >
                <div className="flex items-start gap-2">
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${p.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500">
                      [{NOTIF_TYPE_LABEL[n.type] || n.type}] {date(n)} · приоритет {p.label}
                      {!n.read_at && <span className="ml-1 text-rose-600">· новое</span>}
                    </div>
                    <div className="text-sm text-gray-900">{n.message}</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {n.action_url === 'close_month' ? (
                        <button onClick={onCloseMonth} className="text-xs px-2.5 py-1 rounded-md bg-gray-900 text-white">Закрыть месяц</button>
                      ) : (
                        <button onClick={() => onGo(n.action_url)} className="text-xs px-2.5 py-1 rounded-md bg-gray-900 text-white">Посмотреть</button>
                      )}
                      <button
                        disabled={busy !== null}
                        onClick={() => run(n.id, () => onAction('snooze', n.id))}
                        className="text-xs px-2.5 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-white"
                      >
                        Напомнить через 3 дня
                      </button>
                      <button
                        disabled={busy !== null}
                        onClick={() => run(n.id, () => onAction('dismiss', n.id))}
                        className="text-xs px-2.5 py-1 rounded-md text-gray-500 hover:text-gray-800"
                      >
                        {busy === n.id ? '…' : 'Скрыть'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-[11px] text-gray-400">Уведомления только в интерфейсе: без писем, push и задач. Работать можно, не закрывая их.</p>
    </div>
  );
};

export default DashboardNotifications;
