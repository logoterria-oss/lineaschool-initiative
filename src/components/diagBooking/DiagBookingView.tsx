import { useState } from 'react';
import Icon from '@/components/ui/icon';
import DiagBookingsList from './DiagBookingsList';
import DiagLinks from './DiagLinks';

/** «Запись на диагностику» внутри «Списка лидов»: заявки и ссылки для родителей */
const DiagBookingView = ({ onCount }: { onCount?: (n: number) => void }) => {
  const [tab, setTab] = useState<'list' | 'links'>('list');
  const btn = (id: 'list' | 'links', icon: string, label: string) => (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
        tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      <Icon name={icon} size={15} />
      {label}
    </button>
  );

  return (
    <div>
      <div className="inline-flex items-center gap-1 bg-gray-100 rounded-lg p-1 mb-4">
        {btn('list', 'CalendarCheck', 'Заявки')}
        {btn('links', 'Link', 'Ссылки для родителей')}
      </div>
      {tab === 'list' ? <DiagBookingsList onCount={onCount} /> : <DiagLinks />}
    </div>
  );
};

export default DiagBookingView;
