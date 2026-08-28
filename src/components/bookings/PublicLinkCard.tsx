import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { BookingLink, bookingPageUrl, fetchPublicLink } from '@/lib/bookingsApi';
import { useCopy } from '@/lib/useCopy';

interface Props {
  currentUser?: string;
}

/** Общая ссылка школы: одна на всех, родитель сам вводит имя ребёнка */
const PublicLinkCard = ({ currentUser }: Props) => {
  const [link, setLink] = useState<BookingLink | null>(null);
  const [loading, setLoading] = useState(true);
  const { copiedId, copy } = useCopy();

  useEffect(() => {
    (async () => {
      setLink(await fetchPublicLink(currentUser));
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const url = link ? bookingPageUrl(link.token) : '';

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
      <div className="flex items-center gap-2 mb-1">
        <Icon name="Globe" size={17} className="text-emerald-700" />
        <span className="font-semibold text-emerald-900">Общая ссылка</span>
      </div>
      <p className="text-sm text-emerald-800/80 mb-3">
        Одна на всех: можно публиковать в соцсетях и рассылках. Родитель сам вводит имя ребёнка и
        дату начала занятий.
      </p>

      {loading ? (
        <div className="text-sm text-emerald-800 flex items-center gap-2">
          <Icon name="Loader2" size={15} className="animate-spin" />
          Загружаем…
        </div>
      ) : !link ? (
        <div className="text-sm text-red-600">Не удалось получить ссылку</div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <code className="flex-1 min-w-[240px] bg-white border border-emerald-200 rounded-lg px-3 py-2 text-sm text-gray-700 break-all">
            {url}
          </code>
          <Button onClick={() => copy(url, link.id)} className="gap-1.5">
            <Icon name={copiedId === link.id ? 'Check' : 'Copy'} size={15} />
            {copiedId === link.id ? 'Скопировано' : 'Копировать'}
          </Button>
          <Button variant="outline" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer" className="gap-1.5">
              <Icon name="ExternalLink" size={15} />
              Открыть
            </a>
          </Button>
        </div>
      )}
    </div>
  );
};

export default PublicLinkCard;
