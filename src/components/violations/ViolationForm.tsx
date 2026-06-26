import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { GROUP_TEACHERS, INDIVIDUAL_TEACHERS } from '@/lib/supervisionChecklist';
import { VIOLATION_TYPES, violationByCode } from '@/lib/violationsCatalog';
import { Violation, ViolationInput } from '@/lib/violationsApi';
import { STAFF_ROLES, StaffRoleId } from '@/lib/staffRoles';

const ALL_TEACHERS = [...INDIVIDUAL_TEACHERS, ...GROUP_TEACHERS];

const today = () => new Date().toISOString().slice(0, 10);

const labelCls = 'text-sm font-semibold text-gray-700';
const selectCls =
  'w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-400';

interface Props {
  initial?: Violation | null;
  onSubmit: (input: ViolationInput) => Promise<void>;
  submitLabel?: string;
  // Опциональный выбор роли нарушителя (для кабинета руководителя).
  withRole?: boolean;
  role?: StaffRoleId;
  onRoleChange?: (role: StaffRoleId) => void;
}

const ViolationForm = ({
  initial,
  onSubmit,
  submitLabel = 'Зафиксировать нарушение',
  withRole = false,
  role = 'teacher',
  onRoleChange,
}: Props) => {
  const [teacherId, setTeacherId] = useState<number | ''>(initial?.teacher_id ?? '');
  const [date, setDate] = useState(initial?.violation_date ?? today());
  const [code, setCode] = useState(initial?.violation_code ?? '');
  const [comment, setComment] = useState(initial?.admin_comment ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedType = violationByCode(code);

  const handleSubmit = async () => {
    setError('');
    if (!teacherId) return setError('Выберите педагога');
    if (!date) return setError('Укажите дату');
    if (!selectedType) return setError('Выберите тип нарушения');
    const teacher = ALL_TEACHERS.find((t) => t.id === teacherId);
    if (!teacher) return setError('Педагог не найден');

    setSaving(true);
    try {
      await onSubmit({
        id: initial?.id,
        staff_role: role,
        teacher_id: teacher.id,
        teacher_name: teacher.name,
        violation_date: date,
        violation_code: selectedType.code,
        violation_title: selectedType.title,
        admin_comment: comment || null,
      });
      if (!initial) {
        setCode('');
        setComment('');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
      {withRole && (
        <div className="space-y-1.5">
          <Label className={labelCls}>Роль нарушителя</Label>
          <select
            className={selectCls}
            value={role}
            onChange={(e) => onRoleChange?.(e.target.value as StaffRoleId)}
          >
            {STAFF_ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className={labelCls}>ФИО</Label>
          <select
            className={selectCls}
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">— выберите —</option>
            {ALL_TEACHERS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className={labelCls}>Дата нарушения</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className={labelCls}>Нарушение</Label>
        <select className={selectCls} value={code} onChange={(e) => setCode(e.target.value)}>
          <option value="">— выберите нарушение —</option>
          {VIOLATION_TYPES.map((v) => (
            <option key={v.code} value={v.code}>
              {v.title}
            </option>
          ))}
        </select>
        {selectedType && (
          <p className="text-xs text-gray-500 mt-1">{selectedType.meaning}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className={labelCls}>Комментарий (необязательно)</Label>
        <Textarea
          rows={2}
          placeholder="Детали нарушения"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        onClick={handleSubmit}
        disabled={saving}
        className="bg-red-600 hover:bg-red-700 text-white"
      >
        {saving ? 'Сохранение…' : submitLabel}
      </Button>
    </div>
  );
};

export default ViolationForm;