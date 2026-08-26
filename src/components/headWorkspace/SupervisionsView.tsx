import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import SupervisionForm from '@/components/supervision/SupervisionForm';
import SupervisionsTable from '@/components/supervision/SupervisionsTable';
import SupervisionRates from '@/components/supervision/SupervisionRates';
import { createSupervision, SupervisionInput } from '@/lib/supervisionsApi';
import { useToast } from '@/hooks/use-toast';

const SupervisionsView = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState<'add' | 'summary' | 'rates'>('summary');
  const [formKey, setFormKey] = useState(0);

  const handleCreate = async (input: SupervisionInput) => {
    await createSupervision(input);
    toast({ title: 'Супервизия сохранена', description: input.teacher_name });
    setFormKey((k) => k + 1);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Button variant={tab === 'summary' ? 'default' : 'outline'} onClick={() => setTab('summary')} className="gap-2">
          <Icon name="Table" size={16} />
          Сводная таблица
        </Button>
        <Button variant={tab === 'rates' ? 'default' : 'outline'} onClick={() => setTab('rates')} className="gap-2">
          <Icon name="Wallet" size={16} />
          Ставки
        </Button>
        <Button variant={tab === 'add' ? 'default' : 'outline'} onClick={() => setTab('add')} className="gap-2">
          <Icon name="PlusCircle" size={16} />
          Добавить супервизию
        </Button>
      </div>

      {tab === 'add' && <SupervisionForm key={formKey} onSubmit={handleCreate} />}
      {tab === 'summary' && <SupervisionsTable />}
      {tab === 'rates' && <SupervisionRates />}
    </div>
  );
};

export default SupervisionsView;