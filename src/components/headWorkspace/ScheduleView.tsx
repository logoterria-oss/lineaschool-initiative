import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import IndividualTab from '@/components/schedule/IndividualTab';
import GroupsTab from '@/components/schedule/GroupsTab';
import ExportPdfModal from '@/components/schedule/ExportPdfModal';

const ScheduleView = () => {
  const [tab, setTab] = useState<'individual' | 'groups'>('groups');
  const [showPdf, setShowPdf] = useState(false);

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
        <Button onClick={() => setShowPdf(true)} className="ml-auto gap-2 bg-green-600 hover:bg-green-700">
          <Icon name="FileDown" size={16} />
          Создать PDF
        </Button>
      </div>

      {tab === 'individual' && <IndividualTab />}
      {tab === 'groups' && <GroupsTab />}

      {showPdf && <ExportPdfModal onClose={() => setShowPdf(false)} />}
    </div>
  );
};

export default ScheduleView;
