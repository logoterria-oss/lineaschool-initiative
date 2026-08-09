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
  diag_type?: string;
}

interface ReportCardProps {
  report: SpeechTherapyReport;
  onEdit: (report: SpeechTherapyReport) => void;
  onDelete: (id: number) => void;
  onCopyLink: (linkOrId: string | number) => void;
  canDelete?: boolean;
}

/** Дата и время по-русски; пустая строка, если значения нет или оно битое */
function fmtDateTime(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('ru-RU');
}

export default function ReportCard({ report, onDelete, onCopyLink, canDelete }: ReportCardProps) {
  const isInterim = report.diag_type === 'interim';
  // У промежуточной своя страница заключения
  const reportLink = isInterim ? `/interim_diag/${report.id}` : `/diag/${report.id}`;
  // Открываем ту же форму диагностики, но с данными сохранённого заключения
  const editLink = isInterim
    ? `/interim_diag_form?edit=${report.id}`
    : `/diag_form?edit=${report.id}`;

  return (
    <Card>
      <CardHeader className="report-card-head">
        {/* Раскладка зависит от ширины САМОЙ карточки (см. index.css):
            в кабинете руководителя колонка узкая даже на большом мониторе. */}
        <div className="report-card-head-row flex flex-col gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg">{report.student_name}</CardTitle>
              <Badge className={isInterim ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : 'bg-blue-100 text-blue-700 hover:bg-blue-100'}>
                {isInterim ? 'Промежуточная' : 'Первичная'}
              </Badge>
            </div>
            <CardDescription>
              {report.student_age && `${report.student_age} лет, `}
              {new Date(report.date_of_examination).toLocaleDateString('ru-RU')} | 
              Логопед: {report.therapist_name}
            </CardDescription>
          </div>
          {/* Сетка в 2 колонки на телефоне: кнопки одинаковой ширины
              и достаточной высоты, чтобы попадать пальцем. */}
          <div className="report-card-actions">
            <Button size="sm" variant="outline" className="h-9" asChild>
              <a href={reportLink} target="_blank" rel="noopener noreferrer">
                <Icon name="FileText" size={14} className="mr-1" />
                Заключение
              </a>
            </Button>
            <Button size="sm" variant="outline" className="h-9" asChild>
              <a href={editLink}>
                <Icon name="Pencil" size={14} className="mr-1" />
                Изменить
              </a>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9"
              onClick={() => onCopyLink(reportLink)}
            >
              <Icon name="Link" size={14} className="mr-1" />
              Ссылка
            </Button>
            {canDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(report.id)}
                className="h-9 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Icon name="Trash2" size={14} className="mr-1" />
                Удалить
              </Button>
            )}
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
          Создано: {fmtDateTime(report.created_at)}
          {/* Дата правки бывает пустой у старых записей — тогда не показываем
              строку вовсе, вместо «Invalid Date» */}
          {fmtDateTime(report.updated_at) && ` | Обновлено: ${fmtDateTime(report.updated_at)}`}
        </div>
      </CardContent>
    </Card>
  );
}