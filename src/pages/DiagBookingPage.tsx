import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import DiagContactForm, { DiagContactValues, EMPTY_CONTACT } from '@/components/diagBooking/DiagContactForm';
import { getUtm } from '@/lib/utm';
import {
  DiagBooking,
  DiagLink,
  DiagSlot,
  bookDiag,
  checkDiagLink,
  fetchDiagFreeSlots,
  sendDiagLead,
} from '@/lib/diagBookingApi';

const Centered = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center">{children}</div>
  </div>
);

const DiagBookingPage = () => {
  const { token = '' } = useParams();
  const [link, setLink] = useState<DiagLink | null>(null);
  const [slots, setSlots] = useState<DiagSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [network, setNetwork] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [picked, setPicked] = useState<DiagSlot | null>(null);
  const [contact, setContact] = useState<DiagContactValues>(EMPTY_CONTACT);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<DiagBooking | null>(null);

  const load = async () => {
    setLoading(true);
    setNetwork(false);
    const res = await checkDiagLink(token);
    if (res.network) {
      setNetwork(true);
      setLoading(false);
      return;
    }
    if (!res.link) {
      setError(res.message || '');
      setLoading(false);
      return;
    }
    setLink(res.link);
    setLimitReached(!!res.limitReached);
    if (res.link.childName) setContact((c) => ({ ...c, childName: res.link!.childName }));
    setSlots(await fetchDiagFreeSlots(token));
    setLoading(false);
  };

  useEffect(() => {
    document.title = 'Запись на диагностику';
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const days = useMemo(() => {
    const map = new Map<string, DiagSlot[]>();
    slots.forEach((s) => map.set(s.date, [...(map.get(s.date) || []), s]));
    return [...map.entries()];
  }, [slots]);

  const submit = async () => {
    if (!picked) return;
    setSending(true);
    setError('');
    const input = {
      token,
      slotId: picked.id,
      childName: contact.childName.trim(),
      childBirthDate: contact.childBirthDate,
      parentName: contact.parentName.trim(),
      phone: contact.phone.replace(/\D/g, ''),
      telegram: contact.messengerTelegram && contact.telegram.replace('@', '').trim() ? contact.telegram.trim() : '',
      messengers: [contact.messengerTelegram && 'Telegram', contact.messengerMax && 'Max'].filter(Boolean) as string[],
      marketingConsent: contact.marketingConsent,
      utm: getUtm(),
    };
    const res = await bookDiag(input);
    setSending(false);
    if (res.ok && res.booking) {
      sendDiagLead(input, res.booking);
      setDone(res.booking);
      return;
    }
    setError(res.message || 'Не удалось записаться. Попробуйте ещё раз.');
    if (res.error === 'taken') {
      setPicked(null);
      setSlots(await fetchDiagFreeSlots(token));
    }
  };

  if (loading) {
    return (
      <Centered>
        <Icon name="Loader2" size={28} className="animate-spin mx-auto mb-2 text-gray-400" />
        <p className="text-gray-500">Загружаем свободное время…</p>
      </Centered>
    );
  }

  if (network) {
    return (
      <Centered>
        <Icon name="WifiOff" size={36} className="mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600 mb-4">Не получилось загрузить страницу</p>
        <Button onClick={load}>Повторить</Button>
      </Centered>
    );
  }

  if (!link) {
    return (
      <Centered>
        <Icon name="Link2Off" size={40} className="mx-auto mb-4 text-gray-400" />
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Ссылка недействительна</h1>
        <p className="text-gray-500 text-sm">{error || 'Напишите администратору за новой ссылкой.'}</p>
      </Centered>
    );
  }

  if (done) {
    return (
      <Centered>
        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <Icon name="Check" size={28} className="text-emerald-600" />
        </div>
        <h1 className="text-xl font-semibold text-gray-800 mb-3">Вы записаны на диагностику</h1>
        <p className="text-gray-700 mb-3">
          {done.weekdayName}, {done.dateRu}
          <br />
          {done.timeFrom}–{done.timeTo} (МСК)
        </p>
        <p className="text-gray-500 text-sm">Администратор свяжется с вами, чтобы подтвердить запись.</p>
      </Centered>
    );
  }

  if (limitReached) {
    return (
      <Centered>
        <Icon name="CalendarCheck" size={36} className="mx-auto mb-3 text-emerald-600" />
        <h2 className="font-semibold text-gray-800 mb-1">Запись уже сделана</h2>
        <p className="text-gray-500 text-sm">
          По этой ссылке уже записались. Если нужно перенести — напишите администратору.
        </p>
      </Centered>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-5">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">{link.title || 'Запись на диагностику'}</h1>
          <p className="text-gray-500 text-sm">Выберите удобное время и оставьте контакты</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-800 text-sm mb-4 flex items-center gap-2">
          <Icon name="Clock" size={15} />
          Время указано по Москве (МСК)
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4">{error}</div>
        )}

        {days.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
            <Icon name="CalendarX" size={32} className="mx-auto mb-3 text-gray-400" />
            Свободного времени пока нет. Напишите администратору — подберём время вручную.
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {days.map(([d, list]) => (
              <div key={d} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="font-semibold text-gray-800 mb-2">
                  {list[0].weekdayName}, {list[0].dateRu}
                </div>
                <div className="flex flex-wrap gap-2">
                  {list.map((s) => {
                    const on = picked?.id === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setPicked(on ? null : s)}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                          on
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-emerald-400'
                        }`}
                      >
                        {s.timeFrom}–{s.timeTo}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {days.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-medium text-gray-800 mb-3">
              {picked ? (
                <span className="flex items-center gap-2">
                  <Icon name="CalendarCheck" size={16} className="text-emerald-600" />
                  {picked.weekdayName}, {picked.dateRu} в {picked.timeFrom}–{picked.timeTo}
                </span>
              ) : (
                <span className="text-gray-400">Сначала выберите время выше</span>
              )}
            </div>
            <DiagContactForm
              values={contact}
              onChange={setContact}
              childLocked={!!link.childName && !link.isPublic}
              sending={sending}
              disabled={!picked}
              onSubmit={submit}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagBookingPage;
