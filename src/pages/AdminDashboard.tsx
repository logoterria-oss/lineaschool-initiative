import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import AdminHeader from '@/components/AdminHeader';

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <AdminHeader showOnlyHome />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Панель администратора
            </h1>
            <p className="text-lg text-gray-600">
              Выберите раздел для работы
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-500"
              onClick={() => navigate('/admin/reports')}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Icon name="FileText" className="text-green-600" size={32} />
                  </div>
                  <CardTitle className="text-2xl">Логопедические заключения</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Просмотр и управление диагностическими отчётами
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Icon name="Check" className="text-green-600" size={16} />
                    <span>Просмотр всех заключений</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="Check" className="text-green-600" size={16} />
                    <span>Фильтрация и поиск</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="Check" className="text-green-600" size={16} />
                    <span>Экспорт отчётов</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
              onClick={() => navigate('/admin/dictations')}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Icon name="PenTool" className="text-blue-600" size={32} />
                  </div>
                  <CardTitle className="text-2xl">Проверка диктантов</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Разметка и анализ диктантов из Telegram
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Icon name="Check" className="text-blue-600" size={16} />
                    <span>Визуальная разметка ошибок</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="Check" className="text-blue-600" size={16} />
                    <span>Подсчёт дисграфии и дизорфографии</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="Check" className="text-blue-600" size={16} />
                    <span>Заметки диагноста</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-500"
              onClick={() => navigate('/admin/questionnaires')}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Icon name="ClipboardList" className="text-purple-600" size={32} />
                  </div>
                  <CardTitle className="text-2xl">Анкеты родителей</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Просмотр заполненных родительских анкет
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Icon name="Check" className="text-purple-600" size={16} />
                    <span>Все анкеты в одном месте</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="Check" className="text-purple-600" size={16} />
                    <span>Поиск по ФИО ребёнка</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="Check" className="text-purple-600" size={16} />
                    <span>Полная информация по каждой семье</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2 mx-auto"
            >
              <Icon name="ArrowLeft" size={16} />
              <span>Вернуться на главную</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;