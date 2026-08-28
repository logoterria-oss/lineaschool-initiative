import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import IndividualTab from '@/components/schedule/IndividualTab';
import GroupsTab from '@/components/schedule/GroupsTab';
import ExportPdfModal from '@/components/schedule/ExportPdfModal';
import { PdfMode } from '@/components/schedule/useScheduleData';
import BookingsView from '@/components/headWorkspace/BookingsView';
import { fetchBookings } from '@/lib/bookingsApi';

interface Props {
  currentUser?: string;
}

const ScheduleView = ({ currentUser }: Props) => {
  const [tab, setTab] = useState<'individual' | 'groups' | 'bookings'>('groups');
  const [pdfMode, setPdfMode] = useState<PdfMode | null>(null);
  const [newBookings, setNewBookings] = useState(0);

  // Счётчик необработанных броней на кнопке — чтобы заявку не пропустили
  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const data = await fetchBookings('new');
        if (!stop) setNewBookings(data.newCount);
      } catch {
        /* не критично — просто не покажем счётчик */
      }
    };
    load();
    const timer = setInterval(load, 60000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [tab]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Button variant={tab === 'groups' ? 'default' : 'outline'} onClick={() => setTab('groups')} className="gap-2">
          <Icon name="Users" size={16} />
          Группы
        </Button>
        <Button variant={tab === 'individual' ? 'default' : 'outline'} onClick={() => setTab('individual')} className="gap-2">
          <Icon name="User" size={16} />
          Индивидуальные
        </Button>
        <Button
          variant={tab === 'bookings' ? 'default' : 'outline'}
          onClick={() => setTab('bookings')}
          className="gap-2"
        >
          <Icon name="CalendarPlus" size={16} />
          Брони на занятия
          {newBookings > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-amber-900 text-[11px] font-bold">
              {newBookings}
            </span>
          )}
        </Button>

        {tab !== 'bookings' && (
          <>
            <Button onClick={() => setPdfMode('regular')} className="ml-auto gap-2 bg-green-600 hover:bg-green-700">
              <Icon name="FileDown" size={16} />
              Создать PDF (регулярное расписание)
            </Button>
            <Button onClick={() => setPdfMode('once')} className="gap-2 bg-amber-600 hover:bg-amber-700">
              <Icon name="CalendarClock" size={16} />
              Создать PDF (разовый перенос)
            </Button>
          </>
        )}
      </div>

      {tab === 'individual' && <IndividualTab />}
      {tab === 'groups' && <GroupsTab />}
      {tab === 'bookings' && <BookingsView currentUser={currentUser} />}

      {pdfMode && <ExportPdfModal mode={pdfMode} onClose={() => setPdfMode(null)} />}
    </div>
  );
};

export default ScheduleView;
