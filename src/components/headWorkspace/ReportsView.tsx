import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ReportsToolbar from '@/components/reports/AdminHeader';
import ReportForm from '@/components/reports/ReportForm';
import ReportsList from '@/components/reports/ReportsList';
import { useReportsAdmin } from '@/components/reports/useReportsAdmin';

// Общий пароль доступа к базе заключений. Руководитель уже авторизован в ЛК,
// поэтому подставляем пароль автоматически (автодоступ без повторного ввода).
const REPORTS_PASSWORD = '426874';

const ReportsView = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem('admin_password')) {
      sessionStorage.setItem('admin_password', REPORTS_PASSWORD);
    }
    if (!sessionStorage.getItem('admin_authenticated')) {
      sessionStorage.setItem('admin_authenticated', 'true');
    }
    setReady(true);
  }, []);

  if (!ready) return null;
  return <ReportsInner />;
};

const ReportsInner = () => {
  const {
    reports, loading, error, success, showForm, editingReport, formData,
    setFormData, loadReports, saveReport, deleteReport, editReport,
    copyPublicLink, toggleForm,
  } = useReportsAdmin();

  return (
    <div>
      <ReportsToolbar showForm={showForm} onToggleForm={toggleForm} onRefresh={loadReports} />

      {success && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {showForm && (
        <ReportForm
          formData={formData}
          setFormData={setFormData}
          loading={loading}
          editingReport={editingReport}
          onSave={saveReport}
          onCancel={toggleForm}
        />
      )}

      <ReportsList
        reports={reports}
        loading={loading}
        onEditReport={editReport}
        onDeleteReport={deleteReport}
        onCopyPublicLink={copyPublicLink}
      />
    </div>
  );
};

export default ReportsView;
