import React, { useMemo, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoginForm from './reports/LoginForm';
import AdminHeader from '@/components/AdminHeader';
import ReportsToolbar from './reports/AdminHeader';
import ReportForm from './reports/ReportForm';
import ReportsList from './reports/ReportsList';
import ReportsFilters, { ReportsFilterState } from './reports/ReportsFilters';
import { useReportsAdmin } from './reports/useReportsAdmin';

export default function ReportsAdmin() {
  const {
    password,
    setPassword,
    isAuthenticated,
    reports,
    loading,
    error,
    success,
    showForm,
    editingReport,
    formData,
    setFormData,
    authenticate,
    loadReports,
    saveReport,
    deleteReport,
    editReport,
    copyPublicLink,
    toggleForm
  } = useReportsAdmin();

  const [filters, setFilters] = useState<ReportsFilterState>({
    name: '',
    month: '',
    type: '',
    therapist: '',
  });

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

  if (!isAuthenticated) {
    return (
      <LoginForm
        password={password}
        setPassword={setPassword}
        loading={loading}
        error={error}
        onAuthenticate={authenticate}
      />
    );
  }

  const handleFormCancel = () => {
    toggleForm();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <ReportsToolbar
          showForm={showForm}
          onToggleForm={toggleForm}
          onRefresh={loadReports}
        />

      <ReportsFilters
        filters={filters}
        setFilters={setFilters}
        total={reports.length}
        visible={visibleReports.length}
        therapists={therapists}
        primaryCount={reports.filter((r) => (r.diag_type || 'primary') === 'primary').length}
        interimCount={reports.filter((r) => r.diag_type === 'interim').length}
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
          onCancel={handleFormCancel}
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
    </div>
  );
}