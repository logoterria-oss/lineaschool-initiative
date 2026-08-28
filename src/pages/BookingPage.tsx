import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { Choice, GroupDayCard, IndividualDay } from '@/components/booking/DayCard';
import {
  BookingLink,
  FreeDay,
  GroupDay,
  LessonType,
  createBooking,
  fetchBookingSlots,
} from '@/lib/bookingsApi';

const iso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const BookingPage = () => {
  const { token = '' } = useParams();

  // По умолчанию предлагаем начать с завтрашнего дня
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return iso(d);
  }, []);

  const [startFrom, setStartFrom] = useState(tomorrow);
  const [lessonType, setLessonType] = useState<LessonType>('individual');

  const [link, setLink] = useState<BookingLink | null>(null);
  const [indDays, setIndDays] = useState<FreeDay[]>([]);
  const [groupDays, setGroupDays] = useState<GroupDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [limitReached, setLimitReached] = useState(false);

  const [selected, setSelected] = useState<Choice | null>(null);
  const [childName, setChildName] = useState('');
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const load = async (from: string, type: LessonType) => {
    setLoading(true);
    setError('');
    setSelected(null);

    // Первый запрос будит функцию и иногда не успевает ответить — повторяем
    let data = await fetchBookingSlots(token, from, type);
    if (!data.link && !data.error) {
      data = await fetchBookingSlots(token, from, type);
    }

    if (data.error) {
      setError(data.message || 'Ссылка недействительна');
      setLink(null);
    } else if (!data.link) {
      setError('Не удалось загрузить расписание. Обновите страницу');
    } else {
      setLink(data.link);
      setIndDays(data.individualDays || []);
      setGroupDays(data.groupDays || []);
      setLimitReached(!!data.limitReached);
      if (data.startFrom) setStartFrom(data.startFrom);
      if (data.link.childName && !childName) setChildName(data.link.childName);
    }
    setLoading(false);
  };

  useEffect(() => {
    load(startFrom, lessonType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, lessonType]);

  const submit = async () => {
    if (!selected || !childName.trim()) return;
    setSending(true);
    const res = await createBooking({
      token,
      childName: childName.trim(),
      comment: comment.trim(),
      date: selected.date,
      timeFrom: selected.timeFrom,
      timeTo: selected.timeTo,
      teacherId: selected.teacherId,
      teacherName: selected.teacherName,
      lessonType,
      startFrom,
    });
    setSending(false);
    if (res.ok) {
      setDone(true);
    } else {
      setError(res.message || 'Не удалось забронировать. Попробуйте ещё раз');
      if (res.error === 'taken') load(startFrom, lessonType);
    }
  };

  if (loading && !link) {
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
            {error || 'Напишите администратору за новой ссылкой.'}
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
              {selected.weekdayName}, начиная с {selected.dateRu}
              <br />в {selected.timeFrom}
              <br />
              <span className="text-gray-500 text-sm">педагог {selected.teacherName}</span>
            </p>
          )}
          <p className="text-gray-500 text-sm">
            Администратор свяжется с вами, чтобы подтвердить занятие.
          </p>
        </div>
      </div>
    );
  }

  const days = lessonType === 'groups' ? groupDays : indDays;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            {link.title || 'Запись на занятие'}
          </h1>
          <p className="text-gray-500 text-sm">
            {link.note || 'Выберите удобное время — администратор подтвердит запись.'}
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-800 text-sm mb-4 flex items-center gap-2">
          <Icon name="Clock" size={15} />
          Время указано по Москве (МСК)
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
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                С какого числа готовы начать?
              </label>
              <div className="flex gap-2 flex-wrap">
                <Input
                  type="date"
                  value={startFrom}
                  min={tomorrow}
                  onChange={(e) => setStartFrom(e.target.value)}
                  className="max-w-[190px]"
                />
                <Button
                  variant="outline"
                  onClick={() => load(startFrom, lessonType)}
                  disabled={loading}
                  className="gap-1.5"
                >
                  {loading ? (
                    <Icon name="Loader2" size={15} className="animate-spin" />
                  ) : (
                    <Icon name="Search" size={15} />
                  )}
                  Показать время
                </Button>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setLessonType('individual')}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    lessonType === 'individual'
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-400'
                  }`}
                >
                  Индивидуальные
                </button>
                <button
                  onClick={() => setLessonType('groups')}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    lessonType === 'groups'
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-400'
                  }`}
                >
                  Групповые
                </button>
              </div>
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-500">
                <Icon name="Loader2" size={28} className="animate-spin mx-auto mb-2" />
                Подбираем свободное время…
              </div>
            ) : days.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <Icon name="CalendarOff" size={36} className="mx-auto mb-3 text-gray-400" />
                <h2 className="font-semibold text-gray-800 mb-1">Свободного времени нет</h2>
                <p className="text-gray-500 text-sm">
                  Попробуйте выбрать другую дату начала или напишите администратору — подберём
                  вариант.
                </p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {lessonType === 'groups'
                  ? groupDays.map((day) => (
                      <GroupDayCard
                        key={day.date}
                        day={day}
                        selected={selected}
                        onSelect={setSelected}
                      />
                    ))
                  : indDays.map((day) => (
                      <IndividualDay
                        key={day.date}
                        day={day}
                        selected={selected}
                        onSelect={setSelected}
                      />
                    ))}
              </div>
            )}

            {days.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 sticky bottom-4 shadow-sm">
                {selected ? (
                  <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                    <Icon name="CalendarCheck" size={16} className="text-emerald-600" />
                    <span>
                      {selected.weekdayName} в {selected.timeFrom}, начиная с {selected.dateRu} —{' '}
                      {selected.teacherName}
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
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BookingPage;