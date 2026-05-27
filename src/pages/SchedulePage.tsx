import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import IndividualTab from '@/components/schedule/IndividualTab';
import GroupsTab from '@/components/schedule/GroupsTab';

const SchedulePage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'individual' | 'groups'>('groups');

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <AdminHeader showOnlyHome />
      <div className="container mx-auto px-4 py-8">
        <div className={tab === 'groups' ? 'max-w-7xl mx-auto' : 'max-w-4xl mx-auto'}>

          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate('/admin')} className="text-gray-500 hover:text-gray-800">
              <Icon name="ArrowLeft" size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Расписание (S20)</h1>
          </div>

          {/* Табы */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={tab === 'groups' ? 'default' : 'outline'}
              onClick={() => setTab('groups')}
              className="gap-2"
            >
              <Icon name="Users" size={16} />
              Группы
            </Button>
            <Button
              variant={tab === 'individual' ? 'default' : 'outline'}
              onClick={() => setTab('individual')}
              className="gap-2"
            >
              <Icon name="User" size={16} />
              Индивидуальные
            </Button>
          </div>

          {tab === 'individual' && <IndividualTab />}
          {tab === 'groups' && <GroupsTab />}

        </div>
      </div>
    </div>
  );
};

export default SchedulePage;