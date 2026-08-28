import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Choice, GroupDayCard, IndividualDay, choiceKey } from '@/components/booking/DayCard';
import StartDateScreen from '@/components/booking/StartDateScreen';
import SectionHeader from '@/components/booking/SectionHeader';
import EmptySection from '@/components/booking/EmptySection';
import {
  BookingLink,
  FreeDay,
  GroupDay,
  createBooking,
  fetchAllBookingSlots,
  fetchBookingSlots,
} from '@/lib/bookingsApi';

const iso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Выбор в разделе: список окон + признак осознанного отказа */
interface Section {
  picks: Choice[];
  skipped: boolean;
}

const EMPTY: Section = { picks: [], skipped: false };

const BookingPage = () => {
  const { token = '' } = useParams();

  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return iso(d);
  }, []);

  // Пока дата не подтверждена — показываем только экран с вопросом
  const [startFrom, setStartFrom] = useState(tomorrow);
  const [dateConfirmed, setDateConfirmed] = useState(false);

  const [link, setLink] = useState<BookingLink | null>(null);
  const [indDays, setIndDays] = useState<FreeDay[]>([]);
  const [groupDays, setGroupDays] = useState<GroupDay[]>([]);
  const [doneInd, setDoneInd] = useState(false);
  const [doneGroups, setDoneGroups] = useState(false);
  // Раздел не загрузился — покажем это, а не пустоту
  const [indFailed, setIndFailed] = useState(false);
  const [groupsFailed, setGroupsFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [limitReached, setLimitReached] = useState(false);

  const [ind, setInd] = useState<Section>(EMPTY);
  const [grp, setGrp] = useState<Section>(EMPTY);
  const [childName, setChildName] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const load = async (from: string) => {
    setLoading(true);
    setError('');
    setInd(EMPTY);
    setGrp(EMPTY);

    const data = await fetchAllBookingSlots(token, from);
    setIndFailed(!!data.individualFailed);
    setGroupsFailed(!!data.groupsFailed);

    if (data.error) {
      setError(data.message || 'Ссылка недействительна');
      setLink(null);
    } else if (!data.link) {
      setError('Не удалось загрузить расписание. Попробуйте ещё раз');
    } else {
      setLink(data.link);
      setIndDays(data.individualDays || []);
      setGroupDays(data.groupDays || []);
      setDoneInd(!!data.doneIndividual);
      setDoneGroups(!!data.doneGroups);
      setLimitReached(!!data.limitReached);
      if (data.startFrom) setStartFrom(data.startFrom);
      if (data.link.childName && !childName) setChildName(data.link.childName);
      setDateConfirmed(true);
    }
    setLoading(false);
  };

  // Проверяем ссылку сразу, чтобы не показывать форму по нерабочей ссылке
  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchBookingSlots(token, tomorrow, 'individual');
      if (data.error) setError(data.message || 'Ссылка недействительна');
      else if (data.link) {
        setLink(data.link);
        setLimitReached(!!data.limitReached);
        if (data.link.childName) setChildName(data.link.childName);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Показываем раздел, даже если окон нет: иначе непонятно, есть ли группы вообще
  const showInd = !doneInd;
  const showGroups = !doneGroups;

  // В разделе со свободными окнами нужно либо выбрать время, либо отказаться
  const pending = (days: unknown[], s: Section, done: boolean) =>
    !done && days.length > 0 && s.picks.length === 0 && !s.skipped;
  const missing =
    (pending(indDays, ind, doneInd) ? 1 : 0) + (pending(groupDays, grp, doneGroups) ? 1 : 0);

  // Ребёнок может ходить несколько раз в неделю — заявок столько же
  const chosen = [
    ...ind.picks.map((p) => ({ pick: p, type: 'individual' as const })),
    ...grp.picks.map((p) => ({ pick: p, type: 'groups' as const })),
  ];
  const canSubmit = !!childName.trim() && missing === 0 && chosen.length > 0 && !sending;

  /** Клик по окну: добавляем в выбор или снимаем */
  const toggle = (set: typeof setInd) => (choice: Choice) =>
    set((s) => {
      const key = choiceKey(choice);
      const has = s.picks.some((p) => choiceKey(p) === key);
      return {
        skipped: false,
        picks: has ? s.picks.filter((p) => choiceKey(p) !== key) : [...s.picks, choice],
      };
    });

  /** «Без индивидуальных» / «Без групповых» — сбрасывает выбранное время */
  const skip = (set: typeof setInd) => () =>
    set((s) => (s.skipped ? EMPTY : { picks: [], skipped: true }));

  const submit = async () => {
    if (!canSubmit) return;
    setSending(true);
    for (const { pick, type } of chosen) {
      const res = await createBooking({
        token,
        childName: childName.trim(),
        date: pick.date,
        timeFrom: pick.timeFrom,
        timeTo: pick.timeTo,
        teacherId: pick.teacherId,
        teacherName: pick.teacherName,
        lessonType: type,
        startFrom,
      });
      if (!res.ok) {
        setSending(false);
        setError(res.message || 'Не удалось забронировать. Попробуйте ещё раз');
        if (res.error === 'taken') load(startFrom);
        return;
      }
    }
    setSending(false);
    setDone(true);
  };

  if (loading && !link && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <Icon name="Loader2" size={36} className="animate-spin mx-auto mb-3" />
          Загружаем…
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
          <h1 className="text-xl font-semibold text-gray-800 mb-3">
            {chosen.length > 1 ? 'Занятия забронированы' : 'Время забронировано'}
          </h1>
          <div className="space-y-2 mb-3">
            {chosen.map(({ pick: p, type }) => (
              <p key={choiceKey(p)} className="text-gray-700">
                {p.weekdayName} в {p.timeFrom}–{p.timeTo}
                <br />
                <span className="text-gray-500 text-sm">
                  {type === 'groups' ? 'группа' : 'индивидуально'}, педагог {p.teacherName}
                </span>
              </p>
            ))}
          </div>
          {/* Дата начала одна на все выбранные занятия */}
          <p className="text-gray-600 text-sm mb-3">
            Начало занятий с {startFrom.split('-').reverse().join('.')}
          </p>
          <p className="text-gray-500 text-sm">
            Администратор свяжется с вами, чтобы подтвердить занятие.
          </p>
        </div>
      </div>
    );
  }

  if (limitReached) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md text-center">
          <Icon name="CalendarCheck" size={36} className="mx-auto mb-3 text-emerald-600" />
          <h2 className="font-semibold text-gray-800 mb-1">Занятие уже забронировано</h2>
          <p className="text-gray-500 text-sm">
            По этой ссылке запись уже сделана. Если нужно перенести — напишите администратору.
          </p>
        </div>
      </div>
    );
  }

  // Шаг 1 — спрашиваем дату начала занятий
  if (!dateConfirmed) {
    return (
      <StartDateScreen
        title={link.title || 'Запись на занятие'}
        askChildName={link.isPublic || !link.childName}
        childName={childName}
        onChildNameChange={setChildName}
        value={startFrom}
        min={tomorrow}
        loading={loading}
        error={error}
        onChange={setStartFrom}
        onSubmit={() => load(startFrom)}
      />
    );
  }

  const nothingFree = indDays.length === 0 && groupDays.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-5">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            {link.title || 'Запись на занятие'}
          </h1>
          {/* Имя и дату спросили на первом шаге — здесь только напоминаем */}
          <p className="text-gray-500 text-sm">
            {childName && <span className="font-medium text-gray-700">{childName}</span>}
            {childName && ' · '}
            начало с {startFrom.split('-').reverse().join('.')}
            <button
              onClick={() => setDateConfirmed(false)}
              className="text-emerald-700 underline ml-2 hover:text-emerald-800"
            >
              изменить
            </button>
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

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-500">
            <Icon name="Loader2" size={28} className="animate-spin mx-auto mb-2" />
            Подбираем свободное время…
          </div>
        ) : (
          <>
            {showInd && (
              <div className="mb-6">
                <SectionHeader
                  icon="User"
                  title="Индивидуальные занятия"
                  skipLabel="Без индивидуальных"
                  skipped={ind.skipped}
                  count={ind.picks.length}
                  onSkip={skip(setInd)}
                />
                {!ind.skipped && (
                  <div className="space-y-3">
                    {indDays.length === 0 ? (
                      <EmptySection failed={indFailed} onRetry={() => load(startFrom)} />
                    ) : (
                      indDays.map((day) => (
                        <IndividualDay
                          key={day.date}
                          day={day}
                          selected={ind.picks}
                          onToggle={toggle(setInd)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {showGroups && (
              <div className="mb-6">
                <SectionHeader
                  icon="Users"
                  title="Групповые занятия"
                  skipLabel="Без групповых"
                  skipped={grp.skipped}
                  count={grp.picks.length}
                  onSkip={skip(setGrp)}
                />
                {!grp.skipped && (
                  <div className="space-y-3">
                    {groupDays.length === 0 ? (
                      <EmptySection failed={groupsFailed} onRetry={() => load(startFrom)} />
                    ) : (
                      groupDays.map((day) => (
                        <GroupDayCard
                          key={day.date}
                          day={day}
                          selected={grp.picks}
                          onToggle={toggle(setGrp)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {nothingFree && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 text-center mb-6">
                <p className="text-gray-600 text-sm mb-3">
                  С этой даты свободных занятий нет. Попробуйте более позднюю дату.
                </p>
                <Button variant="outline" onClick={() => setDateConfirmed(false)}>
                  Выбрать другую дату
                </Button>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky bottom-4 shadow-sm">
              {chosen.length > 0 ? (
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-800 mb-1.5">
                    Выбрано занятий: {chosen.length}
                  </div>
                  <div className="space-y-1">
                    {chosen.map(({ pick: p, type }) => (
                      <div
                        key={choiceKey(p)}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <Icon
                          name={type === 'groups' ? 'Users' : 'User'}
                          size={14}
                          className="text-emerald-600 shrink-0"
                        />
                        <span className="flex-1">
                          {p.weekdayName} в {p.timeFrom}–{p.timeTo} — {p.teacherName}
                        </span>
                        <button
                          onClick={() => (type === 'groups' ? toggle(setGrp) : toggle(setInd))(p)}
                          className="text-gray-300 hover:text-red-500 shrink-0"
                          title="Убрать"
                        >
                          <Icon name="X" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400 mb-3">Выберите время выше</div>
              )}

              {missing > 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                  Отметьте время в каждом разделе или нажмите «Без индивидуальных» / «Без
                  групповых».
                </p>
              )}
              {missing === 0 && chosen.length === 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                  Выберите хотя бы одно занятие — иначе бронировать нечего.
                </p>
              )}

              <Button onClick={submit} disabled={!canSubmit} className="w-full gap-2">
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