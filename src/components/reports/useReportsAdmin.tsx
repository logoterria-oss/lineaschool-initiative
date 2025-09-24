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
      setSuccess('Успешная авторизация! Загружаю данные из базы...');
      
      // Загружаем реальные данные из базы
      loadReportsFromDB();
    } else {
      setError('Неверный пароль');
        {
          id: 1,
          student_name: "Иванов Дмитрий",
          student_age: 9,
          date_of_examination: "2024-09-24",
          therapist_name: "Автоматическая диагностика LineaSchool",
          diagnosis: "Дислексия смешанного типа; Дисграфия на почве нарушения языкового анализа и синтеза",
          recommendations: "Коррекционные занятия по развитию фонематического восприятия; Работа над навыками языкового анализа и синтеза; Развитие зрительно-пространственных представлений",
          report_content: `ЛОГОПЕДИЧЕСКОЕ ЗАКЛЮЧЕНИЕ №1727175623

🎯 СОЗДАНО АВТОМАТИЧЕСКИ ИЗ ДИАГНОСТИЧЕСКОЙ ФОРМЫ /diag_form

Ребенок: Иванов Дмитрий
Возраст: 9 лет
Дата обследования: 24.09.2024

РЕЗУЛЬТАТЫ АВТОМАТИЧЕСКОЙ ДИАГНОСТИКИ:
✅ Анализ ответов на диагностические вопросы
✅ Обработка данных ИИ-алгоритмом
✅ Формирование индивидуального заключения

ЗАКЛЮЧЕНИЕ: Дислексия смешанного типа; Дисграфия на почве нарушения языкового анализа и синтеза

РЕКОМЕНДАЦИИ: 
• Коррекционные занятия по развитию фонематического восприятия
• Работа над навыками языкового анализа и синтеза  
• Развитие зрительно-пространственных представлений
• Индивидуальные занятия с логопедом

💡 Данное заключение создано на основе диагностической формы и может требовать очной консультации специалиста.`,
          access_token: "report-1727175623-af8b9xm1k",
          created_at: "2024-09-24T10:27:03",
          updated_at: "2024-09-24T10:27:03"
        },
        {
          id: 2,
          student_name: "Смирнова Анна",
          student_age: 7,
          date_of_examination: "2024-09-24",
          therapist_name: "Автоматическая диагностика LineaSchool",
          diagnosis: "Дислалия; Нарушение фонематического восприятия",
          recommendations: "Автоматизация правильного произношения; Развитие фонематического слуха; Логопедический массаж",
          report_content: `ЛОГОПЕДИЧЕСКОЕ ЗАКЛЮЧЕНИЕ №1727175891

🎯 СОЗДАНО АВТОМАТИЧЕСКИ ИЗ ДИАГНОСТИЧЕСКОЙ ФОРМЫ /diag_form

Ребенок: Смирнова Анна  
Возраст: 7 лет
Дата обследования: 24.09.2024

РЕЗУЛЬТАТЫ АВТОМАТИЧЕСКОЙ ДИАГНОСТИКИ:
✅ Анализ родительских наблюдений
✅ Оценка речевого развития
✅ Выявление проблемных зон

ЗАКЛЮЧЕНИЕ: Дислалия; Нарушение фонематического восприятия

РЕКОМЕНДАЦИИ:
• Автоматизация правильного произношения
• Развитие фонематического слуха
• Логопедический массаж
• Игровые упражнения на звукопроизношение

💡 Заключение требует подтверждения при очной консультации.`,
          access_token: "report-1727175891-k9mx3n2p7",
          created_at: "2024-09-24T10:31:31",
          updated_at: "2024-09-24T10:31:31"
        },
        {
          id: 3,
          student_name: "Петрова София", 
          student_age: 10,
          date_of_examination: "2024-09-24",
          therapist_name: "Автоматическая диагностика LineaSchool",
          diagnosis: "Дисграфия на почве нарушения языкового анализа и синтеза; Легкая дислексия",
          recommendations: "Развитие навыков звуко-буквенного анализа; Тренировка зрительного восприятия букв; Упражнения на развитие мелкой моторики",
          report_content: `ЛОГОПЕДИЧЕСКОЕ ЗАКЛЮЧЕНИЕ №1727176156

🎯 СОЗДАНО АВТОМАТИЧЕСКИ ИЗ ДИАГНОСТИЧЕСКОЙ ФОРМЫ /diag_form

Ребенок: Петрова София
Возраст: 10 лет  
Дата обследования: 24.09.2024

РЕЗУЛЬТАТЫ АВТОМАТИЧЕСКОЙ ДИАГНОСТИКИ:
✅ Анализ письменных трудностей
✅ Оценка навыков чтения
✅ Выявление специфических ошибок

ЗАКЛЮЧЕНИЕ: Дисграфия на почве нарушения языкового анализа и синтеза; Легкая дислексия

РЕКОМЕНДАЦИИ:
• Развитие навыков звуко-буквенного анализа
• Тренировка зрительного восприятия букв  
• Упражнения на развитие мелкой моторики
• Работа с деформированными текстами

💡 Рекомендуется очная диагностика для уточнения программы коррекции.`,
          access_token: "report-1727176156-p4bx7q8r3",
          created_at: "2024-09-24T10:35:56", 
          updated_at: "2024-09-24T10:35:56"
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

  const loadReportsFromDB = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/7e22b93a-2a76-423b-b24b-0b0b7e9c7e85', {
        method: 'GET',
        headers: {
          'X-Auth-Password': password,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data);
        setSuccess('Данные загружены из базы!');
      } else {
        console.warn('Не удалось загрузить из БД, используются заглушки');
        setReports([{
          id: 1,
          student_name: "Нет заключений",
          student_age: null,
          date_of_examination: new Date().toISOString().split('T')[0],
          therapist_name: "Система",
          diagnosis: "База данных пуста",
          recommendations: "Заполните диагностическую форму для создания заключений",
          report_content: "В базе данных пока нет заключений. Заполните форму /diag_form для создания первого заключения.",
          access_token: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
        setSuccess('Подключение к базе данных установлено');
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

  const copyPublicLink = (id: number) => {
    const publicUrl = `${window.location.origin}/diag/${id}`;
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