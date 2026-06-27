import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { StudentRow, saveDiagnostic } from '@/lib/studentsApi';

const today = () => new Date().toISOString().slice(0, 10);

interface Props {
  student: StudentRow | null;
  onClose: () => void;
  onSaved: () => void;
}

const DiagnosticDialog = ({ student, onClose, onSaved }: Props) => {
  const isFirst = !!student && student.diagnostics_count === 0;

  const [date, setDate] = useState(today());
  const [recommendations, setRecommendations] = useState('');
  const [reportLink, setReportLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!student) return;
    setError('');
    if (!date) return setError('Укажите дату диагностики');
    setSaving(true);
    try {
      await saveDiagnostic({
        student_id: student.id,
        student_name: student.name,
        diagnostic_date: date,
        recommendations: recommendations.trim() || undefined,
        report_link: isFirst ? reportLink.trim() || undefined : undefined,
        is_first: isFirst,
      });
      setDate(today());
      setRecommendations('');
      setReportLink('');
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!student} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Диагностика · {student?.name}
            {isFirst && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 align-middle">
                первая
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {student?.last_diagnostic && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
              Последняя диагностика: <b>{student.last_diagnostic}</b>
              {student.next_diagnostic && (
                <>
                  {' · '}следующая (ориентир): <b>{student.next_diagnostic}</b>
                </>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">Дата диагностики</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">
              Рекомендации для педагогов
            </Label>
            <Textarea
              rows={4}
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="Что важно учесть педагогам по итогам диагностики"
            />
          </div>

          {isFirst && (
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">Ссылка на заключение</Label>
              <Input
                type="url"
                value={reportLink}
                onChange={(e) => setReportLink(e.target.value)}
                placeholder="https://..."
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DiagnosticDialog;
