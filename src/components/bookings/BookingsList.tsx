import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import {
  Booking,
  BookingStatus,
  deleteBooking,
  fetchBookings,
  setBookingStatus,
} from '@/lib/bookingsApi';
import { buildInteractionUrl } from '@/lib/interactionUrl';

const STATUS_STYLE: Record<BookingStatus, string> = {
  new: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-gray-100 text-gray-500 border-gray-200',
};

const FILTERS: { id: BookingStatus | 'all'; label: string }[] = [
  { id: 'new', label: 'Новые' },
  { id: 'confirmed', label: 'Подтверждённые' },
  { id: 'rejected', label: 'Отклонённые' },
  { id: 'all', label: 'Все' },
];

const fmtPhone = (raw: string) => {
  const d = (raw || '').replace(/\D/g, '');
  if (d.length !== 11) return raw || '';
  return `+${d[0]} (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9)}`;
};

interface Props {
  currentUser?: string;
}

const BookingsList = ({ currentUser }: Props) => {
  const [filter, setFilter] = useState<BookingStatus | 'all'>('new');
  const [items, setItems] = useState<Booking[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [noteFor, setNoteFor] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const load = async () => {
    setLoading(true);
    const data = await fetchBookings(filter);
    setItems(data.bookings);
    setNewCount(data.newCount);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const changeStatus = async (b: Booking, status: BookingStatus) => {
    setBusyId(b.id);
    await setBookingStatus(b.id, status, currentUser, noteFor === b.id ? note : undefined);
    setBusyId(null);
    setNoteFor(null);
    setNote('');
    load();
  };

  const remove = async (b: Booking) => {
    if (!confirm(`Удалить бронь «${b.childName}» на ${b.dateRu}?`)) return;
    setBusyId(b.id);
    await deleteBooking(b.id);
    setBusyId(null);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <Button
              key={f.id}
              size="sm"
              variant={filter === f.id ? 'default' : 'outline'}
              onClick={() => setFilter(f.id)}
              className="gap-1.5"
            >
              {f.label}
              {f.id === 'new' && newCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-amber-900 text-[11px] font-bold">
                  {newCount}
                </span>
              )}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={load} className="gap-1.5">
          <Icon name="RefreshCw" size={14} />
          Обновить
        </Button>
      </div>

      {loading && (
        <div className="text-center py-10 text-gray-500">
          <Icon name="Loader2" size={28} className="animate-spin mx-auto mb-2" />
          Загрузка…
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Icon name="CalendarOff" size={34} className="mx-auto mb-3" />
          Броней в этом разделе нет
        </div>
      )}

      <div className="space-y-3">
        {!loading &&
          items.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-900">{b.childName}</span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[b.status]}`}
                    >
                      {b.statusLabel}
                    </span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                        b.lessonType === 'groups'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-teal-50 text-teal-700 border-teal-200'
                      }`}
                    >
                      {b.lessonType === 'groups' ? 'Группа' : 'Индивидуально'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">
                    {/* Родитель выбирает день недели и время, а не разовую дату */}
                    {b.weekdayName} в {b.timeFrom}–{b.timeTo}
                    <span className="text-gray-500"> — начиная с {b.dateRu}</span>
                    {b.teacherName && <span className="text-gray-500"> — {b.teacherName}</span>}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    {b.parentName && <span>Родитель: {b.parentName}</span>}
                    {b.phone && <span>{fmtPhone(b.phone)}</span>}
                    {b.processedBy && b.status !== 'new' && <span>Обработал: {b.processedBy}</span>}
                  </div>
                  {b.comment && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                      {b.comment}
                    </div>
                  )}
                  {b.adminNote && (
                    <div className="mt-2 text-xs text-gray-500">
                      Комментарий администратора: {b.adminNote}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {b.dialogId && (
                    <a
                      href={buildInteractionUrl([])}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Открыть переписку в окне взаимодействия"
                    >
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <Icon name="MessagesSquare" size={14} />
                        Диалог
                      </Button>
                    </a>
                  )}
                  {b.status !== 'confirmed' && (
                    <Button
                      size="sm"
                      onClick={() => changeStatus(b, 'confirmed')}
                      disabled={busyId === b.id}
                      className="gap-1.5"
                    >
                      <Icon name="Check" size={14} />
                      Подтвердить
                    </Button>
                  )}
                  {b.status !== 'rejected' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNoteFor(noteFor === b.id ? null : b.id);
                        setNote('');
                      }}
                      disabled={busyId === b.id}
                      className="gap-1.5"
                    >
                      <Icon name="X" size={14} />
                      Отклонить
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(b)}
                    disabled={busyId === b.id}
                    className="text-gray-400 hover:text-red-600"
                    title="Удалить"
                  >
                    <Icon name="Trash2" size={14} />
                  </Button>
                </div>
              </div>

              {noteFor === b.id && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Причина отказа — увидит только команда"
                    rows={2}
                    className="mb-2"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => changeStatus(b, 'rejected')}
                      disabled={busyId === b.id}
                    >
                      Отклонить бронь
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setNoteFor(null)}>
                      Отмена
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default BookingsList;