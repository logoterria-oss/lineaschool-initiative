import { useState } from 'react';
import ViolationForm from '@/components/violations/ViolationForm';
import ViolationsTable from '@/components/violations/ViolationsTable';
import { createViolation, ViolationInput } from '@/lib/violationsApi';
import { useToast } from '@/components/ui/use-toast';

const TeacherViolationsManager = () => {
  const { toast } = useToast();
  const [reloadKey, setReloadKey] = useState(0);

  const handleCreate = async (input: ViolationInput) => {
    await createViolation(input);
    toast({ title: 'Нарушение зафиксировано', description: input.teacher_name });
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Зафиксировать нарушение</h2>
        <ViolationForm onSubmit={handleCreate} />
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Сводная таблица</h2>
        <ViolationsTable reloadKey={reloadKey} />
      </section>
    </div>
  );
};

export default TeacherViolationsManager;
