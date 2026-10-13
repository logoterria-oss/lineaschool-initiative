import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useCopy } from '@/lib/useCopy';
import { DiagLink, diagBookingPageUrl, fetchDiagPublicLink } from '@/lib/diagBookingApi';

/** Общая ссылка на запись: одна на всех */
const DiagLinks = () => {
  const [link, setLink] = useState<DiagLink | null>(null);
  const [loading, setLoading] = useState(true);
  const { copiedId, copy } = useCopy();

  useEffect(() => {
    (async () => {
      setLink(await fetchDiagPublicLink());
      setLoading(false);
    })();
  }, []);

  const url = link ? diagBookingPageUrl(link.token) : '';

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
      <div className="flex items-center gap-2 mb-1">
        <Icon name="Link" size={17} className="text-emerald-700" />
        <span className="font-semibold text-emerald-900">Ссылка для записи</span>
      </div>
      <p className="text-sm text-emerald-800/80 mb-3">
        Отправляйте родителям: они выбирают свободное окно и оставляют контакты.
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
          <code className="flex-1 min-w-[220px] bg-white border border-emerald-200 rounded-lg px-3 py-2 text-sm text-gray-700 break-all">
            {url}
          </code>
          <Button size="sm" onClick={() => copy(url, link.id)} className="gap-1.5">
            <Icon name={copiedId === link.id ? 'Check' : 'Copy'} size={14} />
            {copiedId === link.id ? 'Скопировано' : 'Копировать'}
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer" className="gap-1.5">
              <Icon name="ExternalLink" size={14} />
              Открыть
            </a>
          </Button>
        </div>
      )}
    </div>
  );
};

export default DiagLinks;
