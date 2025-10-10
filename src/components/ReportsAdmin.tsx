import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoginForm from './reports/LoginForm';
import AdminHeader from '@/components/AdminHeader';
import ReportsToolbar from './reports/AdminHeader';
import ReportForm from './reports/ReportForm';
import ReportsList from './reports/ReportsList';
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
        reports={reports}
        loading={loading}
        onEditReport={editReport}
        onDeleteReport={deleteReport}
        onCopyPublicLink={copyPublicLink}
      />
      </div>
    </div>
  );
}