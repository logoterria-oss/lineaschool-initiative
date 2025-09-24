import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import ReportCard, { SpeechTherapyReport } from './ReportCard';

interface ReportsListProps {
  reports: SpeechTherapyReport[];
  loading: boolean;
  onEditReport: (report: SpeechTherapyReport) => void;
  onDeleteReport: (id: number) => void;
  onCopyPublicLink: (token: string) => void;
}

export default function ReportsList({ 
  reports, 
  loading, 
  onEditReport, 
  onDeleteReport, 
  onCopyPublicLink 
}: ReportsListProps) {
  if (reports.length === 0 && !loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Icon name="FileText" size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Заключения не найдены</p>
          <p className="text-sm text-gray-400 mt-2">Создайте первое заключение</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          onEdit={onEditReport}
          onDelete={onDeleteReport}
          onCopyLink={onCopyPublicLink}
        />
      ))}
    </div>
  );
}