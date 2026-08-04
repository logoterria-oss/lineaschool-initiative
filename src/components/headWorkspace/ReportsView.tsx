import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ReportsToolbar from '@/components/reports/AdminHeader';
import ReportForm from '@/components/reports/ReportForm';
import ReportsList from '@/components/reports/ReportsList';
import ReportsFilters, { ReportsFilterState } from '@/components/reports/ReportsFilters';
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

  const [filters, setFilters] = useState<ReportsFilterState>({ name: '', month: '', type: '', therapist: '' });

  const therapists = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      const t = (r.therapist_name || '').trim();
      if (t) set.add(t);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [reports]);

  const visibleReports = useMemo(() => {
    const q = filters.name.trim().toLowerCase();
    return reports.filter((r) => {
      if (q && !(r.student_name || '').toLowerCase().includes(q)) return false;
      if (filters.type && (r.diag_type || 'primary') !== filters.type) return false;
      if (filters.therapist && (r.therapist_name || '').trim() !== filters.therapist) return false;
      if (filters.month) {
        const d = r.date_of_examination ? r.date_of_examination.slice(0, 7) : '';
        if (d !== filters.month) return false;
      }
      return true;
    });
  }, [reports, filters]);

  return (
    <div>
      <ReportsToolbar showForm={showForm} onToggleForm={toggleForm} onRefresh={loadReports} />

      <ReportsFilters
        filters={filters}
        setFilters={setFilters}
        total={reports.length}
        visible={visibleReports.length}
        therapists={therapists}
      />

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
        reports={visibleReports}
        loading={loading}
        onEditReport={editReport}
        onDeleteReport={deleteReport}
        onCopyPublicLink={copyPublicLink}
      />
    </div>
  );
};

export default ReportsView;