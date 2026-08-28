import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import BookingsList from '@/components/bookings/BookingsList';
import BookingLinks from '@/components/bookings/BookingLinks';
import { BOOKINGS_URL } from '@/lib/bookingsApi';

interface Props {
  currentUser?: string;
}

const BookingsView = ({ currentUser }: Props) => {
  const [tab, setTab] = useState<'list' | 'links'>('list');
  const [showFeed, setShowFeed] = useState(false);
  const feedUrl = `${BOOKINGS_URL}?action=feed&status=new`;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant={tab === 'list' ? 'default' : 'outline'}
            onClick={() => setTab('list')}
            className="gap-2"
          >
            <Icon name="CalendarCheck" size={16} />
            Заявки
          </Button>
          <Button
            variant={tab === 'links' ? 'default' : 'outline'}
            onClick={() => setTab('links')}
            className="gap-2"
          >
            <Icon name="Link" size={16} />
            Ссылки для родителей
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowFeed((v) => !v)} className="gap-1.5">
          <Icon name="Code" size={14} />
          Адрес для окна взаимодействия
        </Button>
      </div>

      {showFeed && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 text-sm">
          <div className="font-medium text-gray-800 mb-1">
            Забирать брони из окна взаимодействия можно по адресу:
          </div>
          <code className="block bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs break-all text-gray-700 mb-2">
            {feedUrl}
          </code>
          <p className="text-gray-500 text-xs">
            Отдаёт список новых броней. Замените <b>status=new</b> на <b>all</b>, чтобы получить
            все. Каждая бронь также автоматически создаёт диалог в окне взаимодействия, если у
            ссылки указан телефон родителя.
          </p>
        </div>
      )}

      {tab === 'list' ? (
        <BookingsList currentUser={currentUser} />
      ) : (
        <BookingLinks currentUser={currentUser} />
      )}
    </div>
  );
};

export default BookingsView;
