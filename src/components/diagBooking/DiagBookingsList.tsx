import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  DiagBooking,
  DiagBookingStatus,
  fetchDiagBookings,
  setDiagBookingStatus,
  notifyDiagSlotsChanged,
} from '@/lib/diagBookingApi';

const FILTERS: { id: DiagBookingStatus | 'all'; label: string }[] = [
  { id: 'new', label: 'Новые' },
  { id: 'confirmed', label: 'Подтверждённые' },
  { id: 'rejected', label: 'Отменённые' },
  { id: 'all', label: 'Все' },
];

const BADGE: Record<DiagBookingStatus, string> = {
  new: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-gray-100 text-gray-500',
};

const DiagBookingsList = ({ onCount }: { onCount?: (n: number) => void }) => {
  const [filter, setFilter] = useState<DiagBookingStatus | 'all'>('new');
  const [list, setList] = useState<DiagBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await fetchDiagBookings(filter);
    setList(data.bookings);
    onCount?.(data.newCount);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const change = async (b: DiagBooking, status: DiagBookingStatus) => {
    if (status === 'rejected' && !confirm('Отменить запись? Окно снова станет свободным.')) return;
    setBusy(b.id);
    await setDiagBookingStatus(b.id, status);
    setBusy(null);
    notifyDiagSlotsChanged();
    load();
  };

  return (
    <div>
      <div className="flex gap-1.5 flex-wrap mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              filter === f.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          <Icon name="Loader2" size={24} className="animate-spin mx-auto mb-2" />
          Загрузка…
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Icon name="CalendarCheck" size={32} className="mx-auto mb-3" />
          Записей нет
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-900">{b.childName}</span>
                    {b.childBirthDate && <span className="text-xs text-gray-500">{b.childBirthDate}</span>}
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${BADGE[b.status]}`}>
                      {b.statusLabel}
                    </span>
                  </div>
                  <div className="text-sm text-gray-800 flex items-center gap-1.5 mb-1">
                    <Icon name="CalendarClock" size={14} className="text-emerald-600" />
                    {b.weekdayName}, {b.dateRu} · {b.timeFrom}–{b.timeTo} МСК
                  </div>
                  <div className="text-sm text-gray-600">
                    {b.parentName} · +{b.phone}
                    {b.messengers && ` · ${b.messengers}`}
                    {b.telegram && ` · ${b.telegram}`}
                  </div>
                  {b.processedBy && (
                    <div className="text-xs text-gray-400 mt-1">Обработал(а): {b.processedBy}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  {b.status !== 'confirmed' && (
                    <Button size="sm" disabled={busy === b.id} onClick={() => change(b, 'confirmed')} className="gap-1">
                      <Icon name="Check" size={14} />
                      Подтвердить
                    </Button>
                  )}
                  {b.status !== 'rejected' && (
                    <Button size="sm" variant="outline" disabled={busy === b.id} onClick={() => change(b, 'rejected')} className="gap-1">
                      <Icon name="X" size={14} />
                      Отменить
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiagBookingsList;
