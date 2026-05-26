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
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Панель администратора
            </h1>
            <p className="text-base md:text-lg text-gray-600">
              Выберите раздел для работы
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-500"
              onClick={() => navigate('/admin/reports')}
            >
              <CardHeader className="p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <div className="p-2 md:p-3 bg-green-100 rounded-lg">
                    <Icon name="FileText" className="text-green-600" size={24} />
                  </div>
                  <CardTitle className="text-lg md:text-xl lg:text-2xl">Логопедические заключения</CardTitle>
                </div>
                <CardDescription className="text-sm md:text-base">
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
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-500"
              onClick={() => navigate('/admin/questionnaires')}
            >
              <CardHeader className="p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <div className="p-2 md:p-3 bg-purple-100 rounded-lg">
                    <Icon name="ClipboardList" className="text-purple-600" size={24} />
                  </div>
                  <CardTitle className="text-lg md:text-xl lg:text-2xl">Анкеты родителей</CardTitle>
                </div>
                <CardDescription className="text-sm md:text-base">
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

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-orange-500"
              onClick={() => navigate('/admin/payment-leads')}
            >
              <CardHeader className="p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <div className="p-2 md:p-3 bg-orange-100 rounded-lg">
                    <Icon name="CreditCard" className="text-orange-600" size={24} />
                  </div>
                  <CardTitle className="text-lg md:text-xl lg:text-2xl">Заявки на оплату</CardTitle>
                </div>
                <CardDescription className="text-sm md:text-base">
                  Контакты клиентов, которые начали оплату
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Icon name="Check" className="text-orange-600" size={16} />
                    <span>Контактные данные клиентов</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="Check" className="text-orange-600" size={16} />
                    <span>Выбранные тарифы и суммы</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="Check" className="text-orange-600" size={16} />
                    <span>Дата и время заявки</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-teal-500"
              onClick={() => navigate('/admin/schedule')}
            >
              <CardHeader className="p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <div className="p-2 md:p-3 bg-teal-100 rounded-lg">
                    <Icon name="CalendarDays" className="text-teal-600" size={24} />
                  </div>
                  <CardTitle className="text-lg md:text-xl lg:text-2xl">Расписание занятий</CardTitle>
                </div>
                <CardDescription className="text-sm md:text-base">
                  Занятия и группы из S20 CRM
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Icon name="Check" className="text-teal-600" size={16} />
                    <span>Актуальное расписание групп</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="Check" className="text-teal-600" size={16} />
                    <span>Индивидуальные занятия</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="Check" className="text-teal-600" size={16} />
                    <span>Данные напрямую из S20</span>
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