import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import {
  BookingLink,
  bookingPageUrl,
  createBookingLink,
  deleteBookingLink,
  fetchBookingLinks,
  toggleBookingLink,
} from '@/lib/bookingsApi';

interface Props {
  currentUser?: string;
}

const BookingLinks = ({ currentUser }: Props) => {
  const [links, setLinks] = useState<BookingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const [childName, setChildName] = useState('');

  const load = async () => {
    setLoading(true);
    setLinks(await fetchBookingLinks());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    setCreating(true);
    await createBookingLink({
      childName: childName.trim(),
      expiresAt: null,
      maxBookings: 1,
      createdBy: currentUser,
      title: childName.trim()
        ? `Запись на занятие — ${childName.trim()}`
        : 'Запись на индивидуальное занятие',
    });
    setCreating(false);
    setChildName('');
    load();
  };

  const copy = async (link: BookingLink) => {
    const url = bookingPageUrl(link.token);
    let ok = false;
    try {
      // Работает только на https и по явному клику
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {
      // Запасной путь для старых браузеров и незащищённого соединения
      const area = document.createElement('textarea');
      area.value = url;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      document.body.removeChild(area);
    }

    if (ok) {
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      // Совсем не вышло — показываем ссылку, чтобы скопировать вручную
      prompt('Скопируйте ссылку:', url);
    }
  };

  const remove = async (link: BookingLink) => {
    if (!confirm('Удалить ссылку? Родитель больше не сможет по ней записаться.')) return;
    await deleteBookingLink(link.id);
    load();
  };

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
        <div className="font-semibold text-gray-800 mb-3">Новая ссылка для родителя</div>
        <div className="flex gap-2 items-end flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Имя ребёнка</label>
            <Input
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && childName.trim() && !creating) create();
              }}
              placeholder="Маша Иванова"
            />
          </div>
          <Button onClick={create} disabled={creating || !childName.trim()} className="gap-1.5">
            {creating ? (
              <Icon name="Loader2" size={15} className="animate-spin" />
            ) : (
              <Icon name="Plus" size={15} />
            )}
            Создать ссылку
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          По ссылке можно записаться один раз. Заявка сама попадёт в окно взаимодействия — найдём
          родителя по имени ребёнка.
        </p>
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-500">
          <Icon name="Loader2" size={26} className="animate-spin mx-auto mb-2" />
          Загрузка…
        </div>
      )}

      {!loading && links.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <Icon name="Link" size={32} className="mx-auto mb-3" />
          Ссылок пока нет
        </div>
      )}

      <div className="space-y-2">
        {links.map((l) => {
          const url = bookingPageUrl(l.token);
          const used = l.bookingsCount >= l.maxBookings;
          return (
            <div
              key={l.id}
              className={`bg-white rounded-xl border p-3 ${
                l.active ? 'border-gray-200' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">
                      {l.childName || l.parentName || 'Без имени'}
                    </span>
                    {!l.active && (
                      <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        отключена
                      </span>
                    )}
                    {used && (
                      <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                        использована
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 break-all">{url}</div>
                  <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-x-3">
                    <span>записей: {l.bookingsCount}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => copy(l)} className="gap-1.5">
                    <Icon name={copiedId === l.id ? 'Check' : 'Copy'} size={14} />
                    {copiedId === l.id ? 'Скопировано' : 'Копировать'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await toggleBookingLink(l.id);
                      load();
                    }}
                    title={l.active ? 'Отключить' : 'Включить'}
                  >
                    <Icon name={l.active ? 'ToggleRight' : 'ToggleLeft'} size={18} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(l)}
                    className="text-gray-400 hover:text-red-600"
                    title="Удалить"
                  >
                    <Icon name="Trash2" size={14} />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookingLinks;