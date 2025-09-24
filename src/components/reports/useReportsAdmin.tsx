import { useState, useEffect } from 'react';
import { SpeechTherapyReport } from './ReportCard';
import { ReportFormData } from './ReportForm';

const REPORTS_API_URL = 'https://functions.poehali.dev/903d39bc-07b8-462d-92da-a1922db341aa';

export function useReportsAdmin() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reports, setReports] = useState<SpeechTherapyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState<number | null>(null);
  const [formData, setFormData] = useState<ReportFormData>({
    student_name: '',
    student_age: '',
    date_of_examination: '',
    therapist_name: '',
    diagnosis: '',
    recommendations: '',
    report_content: ''
  });

  const authenticate = async () => {
    if (!password) {
      setError('Введите пароль');
      return;
    }

    setLoading(true);
    
    if (password === '426874') {
      setIsAuthenticated(true);
      setError('');
      setSuccess('Успешная авторизация! Загружаю данные из базы...');
      
      // Загружаем реальные данные из базы
      loadReportsFromDB();
    } else {
      setError('Неверный пароль');
      setLoading(false);
    }
  };

  const loadReportsFromDB = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/903d39bc-07b8-462d-92da-a1922db341aa', {
        method: 'GET',
        headers: {
          'X-Admin-Password': password,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.reports) && data.reports.length > 0) {
          setReports(data.reports);
          setSuccess(`Загружено заключений: ${data.reports.length}`);
        } else {
          setReports([{
            id: 1,
            student_name: "База данных пуста",
            student_age: null,
            date_of_examination: new Date().toISOString().split('T')[0],
            therapist_name: "Система",
            diagnosis: "Заключений пока нет",
            recommendations: "Заполните диагностическую форму /diag_form для создания первого заключения",
            report_content: "В базе данных пока нет заключений. Заполните форму /diag_form для создания первого заключения.",
            access_token: "",
            report_link: "/diag_form",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
          setSuccess('База данных пуста - создайте первое заключение');
        }
      } else {
        console.warn('Ошибка загрузки из БД:', response.status);
        setError('Ошибка загрузки данных из базы');
      }
    } catch (err) {
      console.error('Ошибка загрузки из БД:', err);
      setError('Ошибка подключения к базе данных');
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const response = await fetch(REPORTS_API_URL, {
        method: 'GET',
        headers: {
          'X-Admin-Password': password
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.reports)) {
          setReports(data.reports);
          setSuccess(`Данные обновлены. Заключений: ${data.reports.length}`);
        } else {
          setError('Неверный формат данных от сервера');
        }
      } else {
        const errorData = await response.json().catch(() => null);
        setError(errorData?.error || 'Ошибка при загрузке данных');
      }
    } catch (err) {
      console.error('Ошибка загрузки отчётов:', err);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const saveReport = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const method = editingReport ? 'PUT' : 'POST';
      const url = editingReport 
        ? `${REPORTS_API_URL}?id=${editingReport}`
        : REPORTS_API_URL;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Password': password
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess(editingReport ? 'Отчёт обновлён' : 'Отчёт создан');
        loadReports();
        toggleForm();
      } else {
        const errorData = await response.json().catch(() => null);
        setError(errorData?.error || 'Ошибка при сохранении');
      }
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (id: number) => {
    if (!isAuthenticated || !confirm('Удалить это заключение?')) return;

    setLoading(true);
    try {
      const response = await fetch(`${REPORTS_API_URL}?id=${id}`, {
        method: 'DELETE',
        headers: {
          'X-Auth-Password': password
        }
      });

      if (response.ok) {
        setSuccess('Отчёт удалён');
        loadReports();
      } else {
        const errorData = await response.json().catch(() => null);
        setError(errorData?.error || 'Ошибка при удалении');
      }
    } catch (err) {
      console.error('Ошибка удаления:', err);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const editReport = (report: SpeechTherapyReport) => {
    setFormData({
      student_name: report.student_name,
      student_age: report.student_age?.toString() || '',
      date_of_examination: report.date_of_examination,
      therapist_name: report.therapist_name,
      diagnosis: report.diagnosis,
      recommendations: report.recommendations,
      report_content: report.report_content
    });
    setEditingReport(report.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      student_name: '',
      student_age: '',
      date_of_examination: '',
      therapist_name: '',
      diagnosis: '',
      recommendations: '',
      report_content: ''
    });
  };

  const copyPublicLink = (reportLinkOrId: string | number) => {
    // Если это строка, то это уже готовая ссылка (/diag/1234)
    // Если число, то формируем ссылку по старому формату
    const reportLink = typeof reportLinkOrId === 'string' ? reportLinkOrId : `/diag/${reportLinkOrId}`;
    const publicUrl = `${window.location.origin}${reportLink}`;
    navigator.clipboard.writeText(publicUrl);
    setSuccess('Ссылка скопирована в буфер обмена!');
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    setEditingReport(null);
    resetForm();
  };

  return {
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
  };
}