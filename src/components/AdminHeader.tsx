import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface AdminHeaderProps {
  showOnlyHome?: boolean;
}

const AdminHeader = ({ showOnlyHome = false }: AdminHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isReportsPage = location.pathname === '/admin/reports';
  const isDictationsPage = location.pathname === '/admin/dictations';
  const isDashboard = location.pathname === '/admin';

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img 
                src="https://cdn.poehali.dev/files/13a5c25b-412b-4a65-a320-ddc9ab10719f.png" 
                alt="Linea School" 
                className="w-8 h-8"
              />
              <span className="font-semibold text-gray-900 hidden sm:block">Linea School</span>
            </button>
            
            {!showOnlyHome && !isDashboard && (
              <>
                <div className="h-6 w-px bg-gray-300 hidden md:block"></div>
                <nav className="hidden md:flex items-center gap-2">
                  <Button
                    variant={isReportsPage ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => navigate('/admin/reports')}
                    className={isReportsPage ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    <Icon name="FileText" className="mr-2" size={16} />
                    Заключения
                  </Button>
                  <Button
                    variant={isDictationsPage ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => navigate('/admin/dictations')}
                    className={isDictationsPage ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    <Icon name="PenTool" className="mr-2" size={16} />
                    Диктанты
                  </Button>
                </nav>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!showOnlyHome && !isDashboard && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="hidden sm:flex"
              >
                <Icon name="LayoutGrid" className="mr-2" size={16} />
                Админ-панель
              </Button>
            )}
            {!showOnlyHome && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
              >
                <Icon name="Home" className="mr-2" size={16} />
                <span className="hidden sm:inline">Главная</span>
              </Button>
            )}
            {showOnlyHome && (
              <Button
                variant="outline"
                onClick={() => navigate('/')}
              >
                <Icon name="Home" className="mr-2" size={18} />
                На главную
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;