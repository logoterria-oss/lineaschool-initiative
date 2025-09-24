import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';

interface SpeechTherapyReport {
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
}

interface ReportForm {
  student_name: string;
  student_age: string;
  date_of_examination: string;
  therapist_name: string;
  diagnosis: string;
  recommendations: string;
  report_content: string;
}

export default function ReportsAdmin() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reports, setReports] = useState<SpeechTherapyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState<number | null>(null);
  const [formData, setFormData] = useState<ReportForm>({
    student_name: '',
    student_age: '',
    date_of_examination: '',
    therapist_name: '',
    diagnosis: '',
    recommendations: '',
    report_content: ''
  });

  const REPORTS_API_URL = 'https://functions.poehali.dev/1bb8c10c-2cc3-418c-b375-6525f4fe5080';

  const authenticate = async () => {
    if (!password) {
      setError('Введите пароль');
      return;
    }

    setLoading(true);
    
    // Простая проверка пароля на фронтенде для демонстрации
    if (password === '426874') {
      setIsAuthenticated(true);
      setError('');
      setSuccess('Успешная авторизация! (Демо-режим - база данных недоступна)');
      
      // Демо данные для показа интерфейса
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
    
    // Демо-режим: имитируем сохранение
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
    
    // Демо-режим: имитируем удаление
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

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Администрирование заключений</CardTitle>
            <CardDescription className="text-center">
              Введите пароль для доступа к системе
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && authenticate()}
                placeholder="Введите пароль"
              />
            </div>
            <Button 
              onClick={authenticate} 
              disabled={loading} 
              className="w-full"
            >
              {loading ? 'Проверка...' : 'Войти'}
            </Button>
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Логопедические заключения</h1>
          <p className="text-gray-600">Управление базой данных заключений</p>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 <strong>Автоматическое сохранение:</strong> Заключения из диагностической формы <a href="/diag_form" className="underline hover:text-blue-800">/diag_form</a> автоматически попадают в эту базу данных
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadReports} variant="outline" size="sm">
            <Icon name="RefreshCw" size={16} className="mr-2" />
            Обновить
          </Button>
          <Button 
            onClick={() => {
              setShowForm(!showForm);
              setEditingReport(null);
              resetForm();
            }}
          >
            <Icon name="Plus" size={16} className="mr-2" />
            {showForm ? 'Отменить' : 'Новое заключение'}
          </Button>
        </div>
      </div>

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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingReport ? 'Редактировать заключение' : 'Новое заключение'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="student_name">Имя ученика *</Label>
                <Input
                  id="student_name"
                  value={formData.student_name}
                  onChange={(e) => setFormData({...formData, student_name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="student_age">Возраст</Label>
                <Input
                  id="student_age"
                  type="number"
                  value={formData.student_age}
                  onChange={(e) => setFormData({...formData, student_age: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="date_of_examination">Дата обследования *</Label>
                <Input
                  id="date_of_examination"
                  type="date"
                  value={formData.date_of_examination}
                  onChange={(e) => setFormData({...formData, date_of_examination: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="therapist_name">Логопед *</Label>
                <Input
                  id="therapist_name"
                  value={formData.therapist_name}
                  onChange={(e) => setFormData({...formData, therapist_name: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="diagnosis">Диагноз</Label>
              <Textarea
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="recommendations">Рекомендации</Label>
              <Textarea
                id="recommendations"
                value={formData.recommendations}
                onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="report_content">Текст заключения *</Label>
              <Textarea
                id="report_content"
                value={formData.report_content}
                onChange={(e) => setFormData({...formData, report_content: e.target.value})}
                rows={6}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveReport} disabled={loading}>
                {loading ? 'Сохранение...' : 'Сохранить'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowForm(false);
                  setEditingReport(null);
                  resetForm();
                }}
              >
                Отменить
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{report.student_name}</CardTitle>
                  <CardDescription>
                    {report.student_age && `${report.student_age} лет, `}
                    {new Date(report.date_of_examination).toLocaleDateString('ru-RU')} | 
                    Логопед: {report.therapist_name}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyPublicLink(report.access_token)}
                  >
                    <Icon name="Link" size={14} className="mr-1" />
                    Ссылка
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => editReport(report)}
                  >
                    <Icon name="Edit" size={14} className="mr-1" />
                    Изменить
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => deleteReport(report.id)}
                  >
                    <Icon name="Trash2" size={14} className="mr-1" />
                    Удалить
                  </Button>
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
                Создано: {new Date(report.created_at).toLocaleString('ru-RU')} | 
                Обновлено: {new Date(report.updated_at).toLocaleString('ru-RU')}
              </div>
            </CardContent>
          </Card>
        ))}

        {reports.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-8">
              <Icon name="FileText" size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Заключения не найдены</p>
              <p className="text-sm text-gray-400 mt-2">Создайте первое заключение</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}