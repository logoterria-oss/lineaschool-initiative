import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface ReportFormData {
  student_name: string;
  student_age: string;
  date_of_examination: string;
  therapist_name: string;
  diagnosis: string;
  recommendations: string;
  report_content: string;
}

interface ReportFormProps {
  formData: ReportFormData;
  setFormData: (data: ReportFormData) => void;
  loading: boolean;
  editingReport: number | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function ReportForm({ 
  formData, 
  setFormData, 
  loading, 
  editingReport, 
  onSave, 
  onCancel 
}: ReportFormProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{editingReport ? 'Редактировать заключение' : 'Новое заключение'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="student_name">Имя ученика *</Label>
            <Input
              id="student_name"
              value={formData.student_name}
              onChange={(e) => setFormData({...formData, student_name: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="student_age">Возраст</Label>
            <Input
              id="student_age"
              type="number"
              value={formData.student_age}
              onChange={(e) => setFormData({...formData, student_age: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="date_of_examination">Дата обследования *</Label>
            <Input
              id="date_of_examination"
              type="date"
              value={formData.date_of_examination}
              onChange={(e) => setFormData({...formData, date_of_examination: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="therapist_name">Логопед *</Label>
            <Input
              id="therapist_name"
              value={formData.therapist_name}
              onChange={(e) => setFormData({...formData, therapist_name: e.target.value})}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="diagnosis">Диагноз</Label>
          <Textarea
            id="diagnosis"
            value={formData.diagnosis}
            onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="recommendations">Рекомендации</Label>
          <Textarea
            id="recommendations"
            value={formData.recommendations}
            onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="report_content">Текст заключения *</Label>
          <Textarea
            id="report_content"
            value={formData.report_content}
            onChange={(e) => setFormData({...formData, report_content: e.target.value})}
            rows={6}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={onSave} disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Отменить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}