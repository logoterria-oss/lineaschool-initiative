import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import LeadsListView from '@/components/headWorkspace/LeadsListView';
import DiagBookingView from './DiagBookingView';
import { fetchDiagBookings } from '@/lib/diagBookingApi';

/** «Список лидов» + вкладка записи на диагностику (по аналогии с бронями уроков) */
const LeadsSection = () => {
  const [tab, setTab] = useState<'leads' | 'diag'>('leads');
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const data = await fetchDiagBookings('new');
        if (!stop) setNewCount(data.newCount);
      } catch {
        /* счётчик не критичен */
      }
    };
    load();
    const id = setInterval(load, 60000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div>
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Button variant={tab === 'leads' ? 'default' : 'outline'} onClick={() => setTab('leads')} className="gap-2">
          <Icon name="UserPlus" size={16} />
          Лиды
        </Button>
        <Button variant={tab === 'diag' ? 'default' : 'outline'} onClick={() => setTab('diag')} className="gap-2">
          <Icon name="CalendarPlus" size={16} />
          Запись на диагностику
          {newCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-amber-900 text-[11px] font-bold">
              {newCount}
            </span>
          )}
        </Button>
      </div>
      {tab === 'leads' ? <LeadsListView /> : <DiagBookingView onCount={setNewCount} />}
    </div>
  );
};

export default LeadsSection;
