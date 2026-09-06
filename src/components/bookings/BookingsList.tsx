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
import { CrmCheckResult, checkBookingAgainstCrm } from '@/lib/bookingCrmCheck';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

/** «2026-09-01» → «01.09.2026» */
const fmtDate = (iso: string) => iso.split('-').reverse().join('.');

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
  const [checkingId, setCheckingId] = useState<number | null>(null);
  const [warn, setWarn] = useState<{ booking: Booking; result: CrmCheckResult } | null>(null);

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

  // Перед подтверждением сверяем заявку с расписанием в CRM: если ребёнка
  // завели на другое время, к другому педагогу или ещё не завели — предупреждаем
  const confirmBooking = async (b: Booking) => {
    setCheckingId(b.id);
    const result = await checkBookingAgainstCrm(b);
    setCheckingId(null);
    if (result.ok) {
      changeStatus(b, 'confirmed');
      return;
    }
    setWarn({ booking: b, result });
  };

  const remove = async (b: Booking) => {
    const n = b.lessons?.length ?? 1;
    const what = n > 1 ? `заявку «${b.childName}» (${n} занятия)` : `бронь «${b.childName}»`;
    if (!confirm(`Удалить ${what}?`)) return;
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
                    {(b.lessons?.length ?? 1) > 1 && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-gray-100 text-gray-600 border-gray-200">
                        занятий: {b.lessons!.length}
                      </span>
                    )}
                  </div>
                  {/* Все занятия одной заявки — родитель выбрал их за раз */}
                  <div className="text-sm text-gray-700 space-y-0.5">
                    {(b.lessons || [b]).map((l) => (
                      <div key={l.id} className="flex items-center gap-1.5">
                        <Icon
                          name={l.lessonType === 'groups' ? 'Users' : 'User'}
                          size={13}
                          className={
                            l.lessonType === 'groups' ? 'text-indigo-500' : 'text-teal-600'
                          }
                        />
                        <span>
                          {l.weekdayName} в {l.timeFrom}–{l.timeTo}
                          {l.teacherName && (
                            <span className="text-gray-500"> — {l.teacherName}</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Начало занятий с {b.startFrom ? fmtDate(b.startFrom) : b.dateRu}
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
                      onClick={() => confirmBooking(b)}
                      disabled={busyId === b.id || checkingId === b.id}
                      className="gap-1.5"
                    >
                      <Icon
                        name={checkingId === b.id ? 'Loader2' : 'Check'}
                        size={14}
                        className={checkingId === b.id ? 'animate-spin' : ''}
                      />
                      {checkingId === b.id ? 'Сверяем с CRM…' : 'Подтвердить'}
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

      <AlertDialog open={!!warn} onOpenChange={(o) => !o && setWarn(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Icon name="TriangleAlert" size={20} className="text-amber-500" />
              {warn?.result.failed
                ? 'Не удалось проверить расписание'
                : 'Заявка не совпадает с расписанием в CRM'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                {warn?.result.failed ? (
                  <p>
                    Расписание CRM сейчас недоступно, поэтому сверить заявку не получилось.
                    Можно подтвердить без проверки.
                  </p>
                ) : (
                  <>
                    <p>
                      Проверьте, заведён ли ребёнок «{warn?.booking.childName}» в расписание CRM
                      на выбранные окна:
                    </p>
                    <ul className="space-y-1.5">
                      {warn?.result.mismatches.map((m, i) => (
                        <li key={i} className="bg-amber-50 rounded-lg px-3 py-2 text-amber-900">
                          <span className="font-medium">{m.lesson}</span>
                          <span className="block text-amber-700">{m.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Вернуться</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (warn) changeStatus(warn.booking, 'confirmed');
                setWarn(null);
              }}
            >
              Всё равно подтвердить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BookingsList;