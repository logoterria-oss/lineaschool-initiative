import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

/**
 * Кнопка «В кабинет» на всех внутренних страницах админки.
 *
 * Не показываем:
 *  • на самой главной кабинета и на экране входа/выбора роли;
 *  • на страницах диагностических заключений — там своя навигация,
 *    и заключение часто открывают по прямой ссылке.
 */
const HIDDEN_PATHS = ['/admin', '/admin/role-select', '/admin/home'];

const isDiagPage = (path: string) =>
  path.startsWith('/diag') || path.startsWith('/interim_diag');

const BackToAdminHome = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (!pathname.startsWith('/admin')) return null;
  if (HIDDEN_PATHS.includes(pathname)) return null;
  if (isDiagPage(pathname)) return null;

  return (
    <button
      type="button"
      onClick={() => navigate('/admin/home')}
      title="Вернуться в кабинет"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-3.5 py-2.5 text-sm font-medium text-gray-600 shadow-lg backdrop-blur transition-colors hover:border-green-400 hover:text-green-700 print:hidden"
    >
      <Icon name="LayoutGrid" size={16} />
      В кабинет
    </button>
  );
};

export default BackToAdminHome;
