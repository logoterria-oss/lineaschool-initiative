import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { fetchReviews, Review, ReviewKind } from '@/lib/reviewsApi';

interface Props {
  kind: ReviewKind;
  title: string;
}

/**
 * Отзывы, которые присылает мессенджер по API.
 * Структура полей ещё уточняется, поэтому пока показываем то,
 * что приходит: автора, контакт, оценку и текст.
 */
const ReviewsView = ({ kind, title }: Props) => {
  const [rows, setRows] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setRows(await fetchReviews(kind));
    setLoading(false);
  }, [kind]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {loading ? 'Загружаю…' : `Отзывов: ${rows.length}`}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-700 transition-colors"
        >
          <Icon name="RefreshCw" size={16} />
          Обновить
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-10 justify-center">
          <Icon name="Loader" size={18} className="animate-spin" />
          Загружаю отзывы
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
          <Icon name="MessageSquareDashed" size={28} className="mx-auto text-gray-300 mb-3" />
          <div className="text-sm font-medium text-gray-700">Отзывов пока нет</div>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            Раздел готов к приёму: как только мессенджер начнёт присылать отзывы,
            они появятся здесь автоматически.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="font-medium text-gray-900 text-sm">
                  {r.author_name || 'Без имени'}
                  {r.phone && <span className="text-gray-400 font-normal ml-2">{r.phone}</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {r.rating != null && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <Icon name="Star" size={13} />
                      {r.rating}
                    </span>
                  )}
                  {new Date(r.created_at).toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              {r.text && (
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap leading-snug">
                  {r.text}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsView;
