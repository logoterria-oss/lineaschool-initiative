import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import IndividualTab from '@/components/schedule/IndividualTab';
import GroupsTab from '@/components/schedule/GroupsTab';
import ExportPdfModal from '@/components/schedule/ExportPdfModal';
import { PdfMode } from '@/components/schedule/useScheduleData';

const ScheduleView = () => {
  const [tab, setTab] = useState<'individual' | 'groups'>('groups');
  const [pdfMode, setPdfMode] = useState<PdfMode | null>(null);

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
        <Button onClick={() => setPdfMode('regular')} className="ml-auto gap-2 bg-green-600 hover:bg-green-700">
          <Icon name="FileDown" size={16} />
          Создать PDF (регулярное расписание)
        </Button>
        <Button onClick={() => setPdfMode('once')} className="gap-2 bg-amber-600 hover:bg-amber-700">
          <Icon name="CalendarClock" size={16} />
          Создать PDF (разовый перенос)
        </Button>
      </div>

      {tab === 'individual' && <IndividualTab />}
      {tab === 'groups' && <GroupsTab />}

      {pdfMode && <ExportPdfModal mode={pdfMode} onClose={() => setPdfMode(null)} />}
    </div>
  );
};

export default ScheduleView;