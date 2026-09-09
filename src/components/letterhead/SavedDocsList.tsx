import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { LETTERHEAD_DOCS_URL, SavedDoc } from '@/lib/letterheadApi';

const fmt = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
};

interface Props {
  onOpen?: (doc: SavedDoc) => void;
  refreshKey?: number;
}

const SavedDocsList = ({ onOpen, refreshKey = 0 }: Props) => {
  const [docs, setDocs] = useState<SavedDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(LETTERHEAD_DOCS_URL);
      const j = await r.json();
      setDocs(j.docs || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  const remove = async (id: number) => {
    if (!confirm('Удалить документ из архива?')) return;
    await fetch(`${LETTERHEAD_DOCS_URL}?id=${id}`, { method: 'DELETE' });
    setDocs((p) => p.filter((d) => d.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-8 justify-center">
        <Icon name="Loader2" size={16} className="animate-spin" />
        Загружаем архив…
      </div>
    );
  }

  if (!docs.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Icon name="FolderOpen" size={40} className="mx-auto mb-3 text-gray-300" />
        <p className="text-sm">Пока нет сохранённых документов</p>
        <p className="text-xs text-gray-400 mt-1">
          Создайте бланк и нажмите «Сохранить в архив»
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {docs.map((d) => (
        <div
          key={d.id}
          className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-amber-300 transition-colors"
        >
          <div className="p-2.5 rounded-lg bg-amber-100 flex-shrink-0">
            <Icon name="FileText" size={20} className="text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 text-sm truncate">
              {d.title || d.file_name || 'Без названия'}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {d.doc_number ? `№ ${d.doc_number} · ` : ''}
              {fmt(d.created_at)}
              {d.recipient ? ` · ${d.recipient.split('\n')[0]}` : ''}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {d.pdf_url && (
              <a
                href={d.pdf_url}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800"
                title="Открыть PDF"
              >
                <Icon name="Download" size={17} />
              </a>
            )}
            {onOpen && (
              <button
                onClick={() => onOpen(d)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800"
                title="Открыть в редакторе"
              >
                <Icon name="Pencil" size={17} />
              </button>
            )}
            <button
              onClick={() => remove(d.id)}
              className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
              title="Удалить"
            >
              <Icon name="Trash2" size={17} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SavedDocsList;
