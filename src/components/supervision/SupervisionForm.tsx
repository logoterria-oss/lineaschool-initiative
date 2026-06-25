import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  LessonForm,
  CHECKLIST_BY_FORM,
  TEACHERS_BY_FORM,
  maxTotalScore,
  calcTotalScore,
} from '@/lib/supervisionChecklist';
import { Supervision, SupervisionInput } from '@/lib/supervisionsApi';
import { useStudents } from '@/lib/useStudents';
import StudentCombobox from './StudentCombobox';

const today = () => new Date().toISOString().slice(0, 10);

interface Props {
  initial?: Supervision | null;
  onSubmit: (input: SupervisionInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

const labelCls = 'text-sm font-semibold text-gray-700';
const selectCls =
  'w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400';

const SupervisionForm = ({ initial, onSubmit, onCancel, submitLabel = 'Сохранить супервизию' }: Props) => {
  const [form, setForm] = useState<LessonForm>(initial?.lesson_form ?? 'individual');
  const [teacherId, setTeacherId] = useState<number | ''>(initial?.teacher_id ?? '');
  const [supervisionDate, setSupervisionDate] = useState(initial?.supervision_date ?? today());
  const [lessonDate, setLessonDate] = useState(initial?.lesson_date ?? '');
  const [lessonLink, setLessonLink] = useState(initial?.lesson_link ?? '');
  const [lessonStructure, setLessonStructure] = useState(initial?.lesson_structure ?? '');
  const [comment, setComment] = useState(initial?.reviewer_comment ?? '');
  const [scores, setScores] = useState<Record<string, number>>(initial?.scores ?? {});
  const [studentId, setStudentId] = useState<number | ''>(initial?.student_id ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { students, loading: studentsLoading } = useStudents();
  const selectedStudent = students.find((s) => s.id === studentId);
  const studentAge =
    selectedStudent?.age ?? (studentId === initial?.student_id ? initial?.student_age ?? null : null);

  const teachers = TEACHERS_BY_FORM[form];
  const checklist = CHECKLIST_BY_FORM[form];
  const maxTotal = useMemo(() => maxTotalScore(form), [form]);
  const total = useMemo(() => calcTotalScore(scores), [scores]);

  const handleFormChange = (next: LessonForm) => {
    setForm(next);
    setTeacherId('');
    setScores({});
  };

  const setScore = (key: string, value: number) =>
    setScores((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setError('');
    if (!teacherId) return setError('Выберите педагога');
    if (!supervisionDate) return setError('Укажите дату супервизии');
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return setError('Педагог не найден');

    setSaving(true);
    try {
      await onSubmit({
        id: initial?.id,
        lesson_form: form,
        teacher_id: teacher.id,
        teacher_name: teacher.name,
        supervision_date: supervisionDate,
        lesson_date: lessonDate || null,
        lesson_link: lessonLink || null,
        lesson_structure: lessonStructure || null,
        reviewer_comment: comment || null,
        scores,
        student_id: studentId || null,
        student_name: selectedStudent?.name ?? initial?.student_name ?? null,
        student_age: studentAge,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className={labelCls}>Форма занятия</Label>
            <select
              className={selectCls}
              value={form}
              onChange={(e) => handleFormChange(e.target.value as LessonForm)}
            >
              <option value="individual">Индивидуальное</option>
              <option value="group">Групповое</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className={labelCls}>Педагог</Label>
            <select
              className={selectCls}
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">— выберите —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className={labelCls}>Дата супервизии</Label>
            <Input
              type="date"
              value={supervisionDate}
              onChange={(e) => setSupervisionDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className={labelCls}>Дата урока</Label>
            <Input type="date" value={lessonDate} onChange={(e) => setLessonDate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className={labelCls}>Ученик</Label>
            <StudentCombobox
              students={students}
              loading={studentsLoading}
              value={studentId}
              valueName={initial?.student_name}
              onSelect={(s) => setStudentId(s ? s.id : '')}
            />
          </div>

          <div className="space-y-1.5">
            <Label className={labelCls}>Возраст ученика</Label>
            <Input
              value={studentAge != null ? `${studentAge} лет` : '—'}
              readOnly
              className="bg-gray-50 text-gray-600"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className={labelCls}>Ссылка на урок</Label>
          <Input
            type="url"
            placeholder="https://..."
            value={lessonLink}
            onChange={(e) => setLessonLink(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label className={labelCls}>Структура занятия</Label>
          <Textarea
            rows={3}
            placeholder="Опишите структуру занятия"
            value={lessonStructure}
            onChange={(e) => setLessonStructure(e.target.value)}
          />
        </div>
      </div>

      {/* Чек-лист */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Чек-лист проверки</h3>
        {checklist.map((group) => (
          <div key={group.group} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 text-sm font-bold text-gray-800">{group.group}</div>
            <div className="divide-y divide-gray-100">
              {group.items.map((item) => (
                <div key={item.key} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div className="text-sm text-gray-800">
                    {item.criterion}
                    <span className="text-gray-400"> (макс. {item.max})</span>
                  </div>
                  <div className="flex flex-wrap gap-1 flex-shrink-0">
                    {Array.from({ length: item.max + 1 }, (_, n) => n).map((n) => {
                      const active = scores[item.key] === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setScore(item.key, n)}
                          className={`w-8 h-8 rounded-md text-sm font-semibold transition-colors ${
                            active
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-emerald-100'
                          }`}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label className={labelCls}>Комментарий проверяющего</Label>
        <Textarea
          rows={4}
          placeholder="Общий комментарий по уроку"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <div className="sticky bottom-0 bg-white rounded-xl border border-gray-200 shadow-md p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-100">
            <Icon name="Calculator" size={18} className="text-emerald-600" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Общая оценка</div>
            <div className="text-xl font-bold text-gray-900">
              {total} <span className="text-sm font-normal text-gray-400">/ {maxTotal}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={saving}>
              Отмена
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? 'Сохранение…' : submitLabel}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default SupervisionForm;