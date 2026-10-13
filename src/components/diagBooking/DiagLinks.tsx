import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useCopy } from '@/lib/useCopy';
import {
  DiagLink,
  createDiagLink,
  diagBookingPageUrl,
  fetchDiagLinks,
  fetchDiagPublicLink,
  toggleDiagLink,
} from '@/lib/diagBookingApi';

/** Ссылки для родителей: общая (одна на всех) и персональные */
const DiagLinks = () => {
  const [publicLink, setPublicLink] = useState<DiagLink | null>(null);
  const [links, setLinks] = useState<DiagLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [childName, setChildName] = useState('');
  const [creating, setCreating] = useState(false);
  const { copiedId, copy } = useCopy();

  const load = async () => {
    setLoading(true);
    const [pub, all] = await Promise.all([fetchDiagPublicLink(), fetchDiagLinks()]);
    setPublicLink(pub);
    setLinks(all.filter((l) => !l.isPublic));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    setCreating(true);
    await createDiagLink(childName.trim());
    setCreating(false);
    setChildName('');
    load();
  };

  const LinkRow = ({ l }: { l: DiagLink }) => {
    const url = diagBookingPageUrl(l.token);
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <code className="flex-1 min-w-[220px] bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 break-all">
          {url}
        </code>
        <Button size="sm" onClick={() => copy(url, l.id)} className="gap-1.5">
          <Icon name={copiedId === l.id ? 'Check' : 'Copy'} size={14} />
          {copiedId === l.id ? 'Скопировано' : 'Копировать'}
        </Button>
        <Button size="sm" variant="outline" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer" className="gap-1.5">
            <Icon name="ExternalLink" size={14} />
            Открыть
          </a>
        </Button>
      </div>
    );
  };

  return (
    <div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="Globe" size={17} className="text-emerald-700" />
          <span className="font-semibold text-emerald-900">Общая ссылка</span>
        </div>
        <p className="text-sm text-emerald-800/80 mb-3">
          Одна на всех: можно публиковать в соцсетях и рассылках. Родитель выбирает свободное окно и
          оставляет контакты.
        </p>
        {loading && !publicLink ? (
          <div className="text-sm text-emerald-800 flex items-center gap-2">
            <Icon name="Loader2" size={15} className="animate-spin" />
            Загружаем…
          </div>
        ) : publicLink ? (
          <LinkRow l={publicLink} />
        ) : (
          <div className="text-sm text-red-600">Не удалось получить ссылку</div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
        <div className="font-semibold text-gray-800 mb-1">Персональная ссылка</div>
        <p className="text-xs text-gray-500 mb-3">Для конкретного ребёнка: имя подставится само, записаться можно один раз.</p>
        <div className="flex gap-2 items-end flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Имя ребёнка</label>
            <Input
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && childName.trim() && !creating && create()}
              placeholder="Маша Иванова"
            />
          </div>
          <Button onClick={create} disabled={creating || !childName.trim()} className="gap-1.5">
            {creating ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Plus" size={15} />}
            Создать ссылку
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {links.map((l) => (
          <div key={l.id} className={`bg-white rounded-xl border border-gray-200 p-3 ${l.active ? '' : 'opacity-60'}`}>
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900">{l.childName || 'Без имени'}</span>
                {l.bookingsCount >= l.maxBookings && (
                  <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Записались</span>
                )}
                {!l.active && (
                  <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Отключена</span>
                )}
              </div>
              <button
                onClick={async () => {
                  await toggleDiagLink(l.id);
                  load();
                }}
                className="text-xs text-gray-500 hover:text-gray-800"
              >
                {l.active ? 'Отключить' : 'Включить'}
              </button>
            </div>
            <LinkRow l={l} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiagLinks;
