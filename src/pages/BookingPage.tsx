import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import {
  BookingLink,
  FreeDay,
  FreeSlot,
  createBooking,
  fetchBookingSlots,
} from '@/lib/bookingsApi';

const iso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const fmtRu = (d: Date) => d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

// Показываем окна на две недели вперёд, начиная с завтрашнего дня
const RANGE_DAYS = 14;

const BookingPage = () => {
  const { token = '' } = useParams();

  const [link, setLink] = useState<BookingLink | null>(null);
  const [days, setDays] = useState<FreeDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [limitReached, setLimitReached] = useState(false);

  const [selected, setSelected] = useState<{ day: FreeDay; slot: FreeSlot } | null>(null);
  const [childName, setChildName] = useState('');
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const range = useMemo(() => {
    const from = addDays(new Date(), 1);
    return { from: iso(from), to: iso(addDays(from, RANGE_DAYS - 1)), fromDate: from };
  }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    const data = await fetchBookingSlots(token, range.from, range.to);
    if (data.error) {
      setError(data.message || 'Ссылка недействительна');
      setLink(null);
    } else {
      setLink(data.link || null);
      setDays(data.days || []);
      setLimitReached(!!data.limitReached);
      if (data.link?.childName) setChildName(data.link.childName);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const submit = async () => {
    if (!selected || !childName.trim()) return;
    setSending(true);
    const res = await createBooking({
      token,
      childName: childName.trim(),
      comment: comment.trim(),
      date: selected.day.date,
      timeFrom: selected.slot.timeFrom,
      timeTo: selected.slot.timeTo,
      teacherId: selected.slot.teacherId,
      teacherName: selected.slot.teacherName,
    });
    setSending(false);
    if (res.ok) {
      setDone(true);
    } else {
      setError(res.message || 'Не удалось забронировать. Попробуйте ещё раз');
      if (res.error === 'taken') {
        setSelected(null);
        load();
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <Icon name="Loader2" size={36} className="animate-spin mx-auto mb-3" />
          Загружаем свободное время…
        </div>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md text-center">
          <Icon name="LinkOff" fallback="Link2Off" size={40} className="mx-auto mb-4 text-gray-400" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Ссылка недействительна</h1>
          <p className="text-gray-500 text-sm">
            {error || 'Возможно, срок действия истёк. Напишите администратору за новой ссылкой.'}
          </p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <Icon name="Check" size={28} className="text-emerald-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Время забронировано</h1>
          {selected && (
            <p className="text-gray-700 mb-3">
              {selected.day.weekdayName}, {selected.day.dateRu} в {selected.slot.timeFrom}
              <br />
              <span className="text-gray-500 text-sm">педагог {selected.slot.teacherName}</span>
            </p>
          )}
          <p className="text-gray-500 text-sm">
            Администратор свяжется с вами, чтобы подтвердить занятие.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            {link.title || 'Запись на индивидуальное занятие'}
          </h1>
          <p className="text-gray-500 text-sm">
            {link.note || 'Выберите удобное время — администратор подтвердит запись.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4">
            {error}
          </div>
        )}

        {limitReached ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <Icon name="CalendarCheck" size={36} className="mx-auto mb-3 text-emerald-600" />
            <h2 className="font-semibold text-gray-800 mb-1">Занятие уже забронировано</h2>
            <p className="text-gray-500 text-sm">
              По этой ссылке запись уже сделана. Если нужно перенести — напишите администратору.
            </p>
          </div>
        ) : days.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <Icon name="CalendarOff" size={36} className="mx-auto mb-3 text-gray-400" />
            <h2 className="font-semibold text-gray-800 mb-1">Свободного времени пока нет</h2>
            <p className="text-gray-500 text-sm">
              Все окна на ближайшие две недели заняты. Напишите администратору — подберём вариант.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {days.map((day) => (
                <div key={day.date} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="font-semibold text-gray-800 mb-3">
                    {day.weekdayName}
                    <span className="text-gray-400 font-normal ml-2 text-sm">{day.dateRu}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {day.slots.map((slot) => {
                      const isSelected =
                        selected?.day.date === day.date &&
                        selected?.slot.timeFrom === slot.timeFrom &&
                        selected?.slot.teacherId === slot.teacherId;
                      return (
                        <button
                          key={`${slot.timeFrom}-${slot.teacherId}`}
                          type="button"
                          onClick={() => setSelected({ day, slot })}
                          className={`rounded-lg border px-3 py-2 text-left transition ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-gray-200 hover:border-emerald-400'
                          }`}
                        >
                          <div className="text-sm font-semibold">
                            {slot.timeFrom}–{slot.timeTo}
                          </div>
                          <div
                            className={`text-[11px] ${
                              isSelected ? 'text-emerald-50' : 'text-gray-500'
                            }`}
                          >
                            {slot.teacherName}
                          </div>
                          {slot.availableFrom && (
                            <div
                              className={`text-[11px] font-medium ${
                                isSelected ? 'text-amber-100' : 'text-amber-600'
                              }`}
                            >
                              с {fmtRu(new Date(`${slot.availableFrom}T00:00:00`))}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky bottom-4 shadow-sm">
              {selected ? (
                <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                  <Icon name="CalendarCheck" size={16} className="text-emerald-600" />
                  <span>
                    {selected.day.weekdayName}, {selected.day.dateRu} в {selected.slot.timeFrom} —{' '}
                    {selected.slot.teacherName}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-gray-400 mb-3">Выберите время выше</div>
              )}

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Имя ребёнка <span className="text-red-500">*</span>
              </label>
              <Input
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Например, Маша Иванова"
                className="mb-3"
              />

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Комментарий <span className="text-gray-400 font-normal">— необязательно</span>
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Пожелания или вопросы"
                rows={2}
                className="mb-4"
              />

              <Button
                onClick={submit}
                disabled={!selected || !childName.trim() || sending}
                className="w-full gap-2"
              >
                {sending ? (
                  <Icon name="Loader2" size={16} className="animate-spin" />
                ) : (
                  <Icon name="Check" size={16} />
                )}
                Забронировать
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingPage;
