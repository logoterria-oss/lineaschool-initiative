import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import QuestionnairesView from '@/components/headWorkspace/QuestionnairesView';
import ReportsView from '@/components/headWorkspace/ReportsView';

const DocsView = () => {
  const [tab, setTab] = useState<'questionnaires' | 'reports'>('questionnaires');

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Button
          variant={tab === 'questionnaires' ? 'default' : 'outline'}
          onClick={() => setTab('questionnaires')}
          className="gap-2"
        >
          <Icon name="ClipboardList" size={16} />
          Анкеты родителей
        </Button>
        <Button
          variant={tab === 'reports' ? 'default' : 'outline'}
          onClick={() => setTab('reports')}
          className="gap-2"
        >
          <Icon name="FileText" size={16} />
          Логопедические заключения
        </Button>
      </div>

      {tab === 'questionnaires' && <QuestionnairesView />}
      {tab === 'reports' && <ReportsView />}
    </div>
  );
};

export default DocsView;
