import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import ReportCard, { SpeechTherapyReport } from './ReportCard';
import { useCanDeleteReports } from './canDeleteReports';

interface ReportsListProps {
  reports: SpeechTherapyReport[];
  loading: boolean;
  onEditReport: (report: SpeechTherapyReport) => void;
  onDeleteReport: (id: number) => void;
  onCopyPublicLink: (linkOrId: string | number) => void;
}

export default function ReportsList({ 
  reports, 
  loading, 
  onEditReport, 
  onDeleteReport, 
  onCopyPublicLink 
}: ReportsListProps) {
  // Право на удаление определяем один раз для всего списка
  const canDelete = useCanDeleteReports();

  if (loading && reports.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-5">
              <div className="animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-52 rounded bg-gray-200" />
                  <div className="h-5 w-20 rounded-full bg-gray-200" />
                </div>
                <div className="h-4 w-72 rounded bg-gray-200" />
                <div className="h-4 w-40 rounded bg-gray-200" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

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
          canDelete={canDelete}
        />
      ))}
    </div>
  );
}