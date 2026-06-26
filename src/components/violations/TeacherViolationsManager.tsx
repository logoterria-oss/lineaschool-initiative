import { useState } from 'react';
import Icon from '@/components/ui/icon';
import ViolationForm from '@/components/violations/ViolationForm';
import ViolationsTable from '@/components/violations/ViolationsTable';
import { createViolation, ViolationInput } from '@/lib/violationsApi';
import { useToast } from '@/components/ui/use-toast';
import { STAFF_ROLES, StaffRoleId } from '@/lib/staffRoles';

interface Props {
  // Если true — в форме появляется выбор роли нарушителя (для руководителя).
  withRole?: boolean;
}

const TeacherViolationsManager = ({ withRole = false }: Props) => {
  const { toast } = useToast();
  const [reloadKey, setReloadKey] = useState(0);
  const [role, setRole] = useState<StaffRoleId>('teacher');

  const activeRole = STAFF_ROLES.find((r) => r.id === role)!;
  const ready = !withRole || role === 'teacher';

  const handleCreate = async (input: ViolationInput) => {
    await createViolation(input);
    toast({ title: 'Нарушение зафиксировано', description: input.teacher_name });
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Зафиксировать нарушение</h2>
        {ready ? (
          <ViolationForm
            onSubmit={handleCreate}
            withRole={withRole}
            role={role}
            onRoleChange={setRole}
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Роль нарушителя</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRoleId)}
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-400">
              <Icon name={activeRole.icon} size={28} className="mx-auto mb-2 text-gray-300" />
              Учёт нарушений для роли «{activeRole.label}» в разработке
            </div>
          </div>
        )}
      </section>

      {ready && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Сводная таблица</h2>
          <ViolationsTable reloadKey={reloadKey} />
        </section>
      )}
    </div>
  );
};

export default TeacherViolationsManager;