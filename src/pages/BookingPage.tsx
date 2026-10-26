import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Choice, choiceKey } from '@/components/booking/DayCard';
import StartDateScreen from '@/components/booking/StartDateScreen';
import { GroupsSection, IndividualSection } from '@/components/booking/BookingSections';
import BookingSummary from '@/components/booking/BookingSummary';
import {
  DoneScreen,
  InvalidLinkScreen,
  LimitReachedScreen,
  LoadingScreen,
  NetFailedScreen,
} from '@/components/booking/BookingStatusScreens';
import {
  BookingLink,
  FreeDay,
  GroupDay,
  checkBookingLink,
  createBooking,
  fetchAllBookingSlots,
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
  // Групповые показываем раскрытыми, индивидуальные — свёрнутыми
  const [openGrp, setOpenGrp] = useState(true);
  const [openInd, setOpenInd] = useState(false);
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

  // Сбой связи — это не «ссылка недействительна»: даём повторить
  const [netFailed, setNetFailed] = useState(false);

  // Проверяем ссылку сразу (быстро, без расписания), чтобы не показывать форму по нерабочей ссылке
  const checkLink = async () => {
    setLoading(true);
    setNetFailed(false);
    setError('');
    const data = await checkBookingLink(token);
    if (data.error) setError(data.message || 'Ссылка недействительна');
    else if (data.link) {
      setLink(data.link);
      setLimitReached(!!data.limitReached);
      if (data.link.childName) setChildName(data.link.childName);
    } else {
      setNetFailed(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkLink();
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
    // Все выбранные занятия уходят одной заявкой — у администратора это
    // будет одна карточка, а не отдельная запись на каждый урок
    const res = await createBooking({
      token,
      childName: childName.trim(),
      startFrom,
      slots: chosen.map(({ pick, type }) => ({
        date: pick.date,
        timeFrom: pick.timeFrom,
        timeTo: pick.timeTo,
        teacherId: pick.teacherId,
        teacherName: pick.teacherName,
        lessonType: type,
      })),
    });
    setSending(false);

    if (!res.ok) {
      const msg = res.message || 'Не удалось забронировать. Попробуйте ещё раз';
      if (res.error === 'taken') await load(startFrom);
      setError(msg);
      return;
    }
    setDone(true);
  };

  if (loading && !link && !error) return <LoadingScreen />;

  if (!link && netFailed) return <NetFailedScreen loading={loading} onRetry={checkLink} />;

  if (!link) return <InvalidLinkScreen error={error} />;

  if (done) return <DoneScreen chosen={chosen} startFrom={startFrom} />;

  if (limitReached) return <LimitReachedScreen />;

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
            {showGroups && (
              <GroupsSection
                days={groupDays}
                picks={grp.picks}
                skipped={grp.skipped}
                open={openGrp}
                failed={groupsFailed}
                onSkip={skip(setGrp)}
                onToggleOpen={() => setOpenGrp((v) => !v)}
                onToggle={toggle(setGrp)}
                onRetry={() => load(startFrom)}
              />
            )}

            {showInd && (
              <IndividualSection
                days={indDays}
                picks={ind.picks}
                skipped={ind.skipped}
                open={openInd}
                failed={indFailed}
                onSkip={skip(setInd)}
                onToggleOpen={() => setOpenInd((v) => !v)}
                onToggle={toggle(setInd)}
                onRetry={() => load(startFrom)}
              />
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

            <BookingSummary
              chosen={chosen}
              missing={missing}
              canSubmit={canSubmit}
              sending={sending}
              onRemove={({ pick, type }) => (type === 'groups' ? toggle(setGrp) : toggle(setInd))(pick)}
              onSubmit={submit}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default BookingPage;