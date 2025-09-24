import { useState, useEffect } from 'react';
import { SpeechTherapyReport } from './ReportCard';
import { ReportFormData } from './ReportForm';

const REPORTS_API_URL = 'https://functions.poehali.dev/1bb8c10c-2cc3-418c-b375-6525f4fe5080';

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
      setSuccess('Успешная авторизация! (Демо-режим - база данных недоступна)');
      
      setReports([
        {
          id: 1,
          student_name: "Петрова Анна",
          student_age: 10,
          date_of_examination: "2024-09-15",
          therapist_name: "Логопед LineaSchool",
          diagnosis: "Дислексия смешанного типа; Дисграфия на почве нарушения языкового анализа и синтеза",
          recommendations: "Коррекционные занятия по развитию фонематического восприятия; Работа над навыками языкового анализа и синтеза; Развитие зрительно-пространственных представлений",
          report_content: `ЛОГОПЕДИЧЕСКОЕ ЗАКЛЮЧЕНИЕ

Ребенок: Петрова Анна Михайловна
Возраст: 10 лет
Класс: 4 класс
Родитель/опекун: Петрова Елена Владимировна

Жалобы: Трудности при чтении и письме, медленный темп чтения, ошибки в письменных работах

РЕЗУЛЬТАТЫ ОБСЛЕДОВАНИЯ:
Моторная реализация речи: Искажение звукопроизношения отдельных звуков
Грамматический строй: Нарушение согласования и управления в сложных конструкциях
Навык чтения: Побуквенное чтение, замены букв при чтении
Дисграфические ошибки: Пропуски букв, замены по оптическому сходству

ЗАКЛЮЧЕНИЕ: Дислексия смешанного типа; Дисграфия на почве нарушения языкового анализа и синтеза

РЕКОМЕНДАЦИИ: Коррекционные занятия по развитию фонематического восприятия; Работа над навыками языкового анализа и синтеза; Развитие зрительно-пространственных представлений`,
          access_token: "demo-token-from-diag-form-123",
          created_at: "2024-09-15T10:00:00",
          updated_at: "2024-09-15T10:00:00"
        },
        {
          id: 2,
          student_name: "Сидоров Максим",
          student_age: 8,
          date_of_examination: "2024-09-20",
          therapist_name: "Логопед LineaSchool",
          diagnosis: "Дислалия; Нарушение письменной речи легкой степени",
          recommendations: "Автоматизация правильного произношения; Развитие мелкой моторики",
          report_content: `ЛОГОПЕДИЧЕСКОЕ ЗАКЛЮЧЕНИЕ

Создано автоматически из диагностической формы /diag_form

Ребенок: Сидоров Максим Андреевич
Возраст: 8 лет
Класс: 2 класс

ЗАКЛЮЧЕНИЕ: Дислалия; Нарушение письменной речи легкой степени
РЕКОМЕНДАЦИИ: Автоматизация правильного произношения; Развитие мелкой моторики`,
          access_token: "demo-token-from-diag-form-456",
          created_at: "2024-09-20T14:30:00",
          updated_at: "2024-09-20T14:30:00"
        }
      ]);
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(REPORTS_API_URL, {
        method: 'GET',
        headers: {
          'X-Auth-Password': password,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data);
        setIsAuthenticated(true);
        setError('');
        setSuccess('Успешная авторизация!');
      } else {
        const errorData = await response.json().catch(() => null);
        setError(errorData?.error || 'Неверный пароль');
      }
    } catch (err) {
      console.error('Ошибка подключения:', err);
      setError('Временно работает демо-режим. Введите пароль 426874 для просмотра интерфейса.');
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
          'X-Auth-Password': password
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data);
      } else {
        setError('Ошибка загрузки заключений');
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const saveReport = async () => {
    if (!formData.student_name || !formData.date_of_examination || !formData.therapist_name || !formData.report_content) {
      setError('Заполните обязательные поля');
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      const newReport: SpeechTherapyReport = {
        id: editingReport || reports.length + 1,
        student_name: formData.student_name,
        student_age: formData.student_age ? parseInt(formData.student_age) : 0,
        date_of_examination: formData.date_of_examination,
        therapist_name: formData.therapist_name,
        diagnosis: formData.diagnosis || '',
        recommendations: formData.recommendations || '',
        report_content: formData.report_content,
        access_token: `demo-token-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (editingReport) {
        setReports(prev => prev.map(r => r.id === editingReport ? newReport : r));
        setSuccess('Заключение обновлено! (Демо-режим)');
      } else {
        setReports(prev => [newReport, ...prev]);
        setSuccess(`Заключение создано! Токен доступа: ${newReport.access_token} (Демо-режим)`);
      }
      
      setShowForm(false);
      setEditingReport(null);
      resetForm();
      setLoading(false);
    }, 1000);
  };

  const deleteReport = async (id: number) => {
    if (!confirm('Удалить заключение?')) return;

    setLoading(true);
    
    setTimeout(() => {
      setReports(prev => prev.filter(r => r.id !== id));
      setSuccess('Заключение удалено! (Демо-режим)');
      setLoading(false);
    }, 500);
  };

  const editReport = (report: SpeechTherapyReport) => {
    setFormData({
      student_name: report.student_name,
      student_age: report.student_age?.toString() || '',
      date_of_examination: report.date_of_examination,
      therapist_name: report.therapist_name,
      diagnosis: report.diagnosis || '',
      recommendations: report.recommendations || '',
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

  const copyPublicLink = (token: string) => {
    const publicUrl = `https://functions.poehali.dev/90c2b81a-149c-41ae-aaa0-2693751f9619?token=${token}`;
    navigator.clipboard.writeText(publicUrl);
    setSuccess('Ссылка скопирована в буфер обмена!');
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    setEditingReport(null);
    resetForm();
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
    resetForm,
    copyPublicLink,
    toggleForm
  };
}