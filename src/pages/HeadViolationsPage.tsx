import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import Icon from '@/components/ui/icon';
import ViolationForm from '@/components/violations/ViolationForm';
import ViolationsTable from '@/components/violations/ViolationsTable';
import { createViolation, ViolationInput } from '@/lib/violationsApi';
import { useToast } from '@/components/ui/use-toast';

const HeadViolationsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reloadKey, setReloadKey] = useState(0);

  const handleCreate = async (input: ViolationInput) => {
    await createViolation(input);
    toast({ title: 'Нарушение зафиксировано', description: input.teacher_name });
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <AdminHeader showOnlyHome />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => navigate('/admin/manager')}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div className="p-2 bg-red-100 rounded-lg">
              <Icon name="AlertTriangle" size={24} className="text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Дисциплинарные и организационные нарушения
              </h1>
              <p className="text-gray-500 text-sm">Учёт нарушений и штрафных баллов педагогов</p>
            </div>
          </div>

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
        </div>
      </div>
    </div>
  );
};

export default HeadViolationsPage;