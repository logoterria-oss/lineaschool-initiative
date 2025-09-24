import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

export interface SpeechTherapyReport {
  id: number;
  student_name: string;
  student_age: number;
  date_of_examination: string;
  therapist_name: string;
  diagnosis: string;
  recommendations: string;
  report_content: string;
  access_token: string;
  created_at: string;
  updated_at: string;
}

interface ReportCardProps {
  report: SpeechTherapyReport;
  onEdit: (report: SpeechTherapyReport) => void;
  onDelete: (id: number) => void;
  onCopyLink: (token: string) => void;
}

export default function ReportCard({ report, onEdit, onDelete, onCopyLink }: ReportCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{report.student_name}</CardTitle>
            <CardDescription>
              {report.student_age && `${report.student_age} лет, `}
              {new Date(report.date_of_examination).toLocaleDateString('ru-RU')} | 
              Логопед: {report.therapist_name}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onCopyLink(report.access_token)}
            >
              <Icon name="Link" size={14} className="mr-1" />
              Ссылка
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onEdit(report)}
            >
              <Icon name="Edit" size={14} className="mr-1" />
              Изменить
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => onDelete(report.id)}
            >
              <Icon name="Trash2" size={14} className="mr-1" />
              Удалить
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {report.diagnosis && (
          <div className="mb-2">
            <Badge variant="outline">Диагноз</Badge>
            <p className="mt-1 text-sm">{report.diagnosis}</p>
          </div>
        )}
        {report.recommendations && (
          <div className="mb-2">
            <Badge variant="outline">Рекомендации</Badge>
            <p className="mt-1 text-sm">{report.recommendations}</p>
          </div>
        )}
        <div className="text-xs text-gray-500 mt-4">
          Создано: {new Date(report.created_at).toLocaleString('ru-RU')} | 
          Обновлено: {new Date(report.updated_at).toLocaleString('ru-RU')}
        </div>
      </CardContent>
    </Card>
  );
}