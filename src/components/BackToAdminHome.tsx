import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

/**
 * Кнопка «В кабинет» на всех внутренних страницах админки.
 * Ведёт в рабочий кабинет со списком всех разделов, а не на экран входа.
 *
 * Не показываем:
 *  • на самом кабинете и на экране входа/выбора роли;
 *  • на страницах диагностических заключений — там своя навигация,
 *    и заключение часто открывают по прямой ссылке.
 */
const HIDDEN_PATHS = ['/admin', '/admin/role-select'];

/** Рабочий кабинет со всеми разделами — свой для каждой роли */
const ROLE_WORKSPACE: Record<string, string> = {
  admin: '/admin/admin-workspace',
  head: '/admin/head-workspace',
  teacher: '/admin/teacher',
  diag: '/admin/diag',
};

const isDiagPage = (path: string) =>
  path.startsWith('/diag') || path.startsWith('/interim_diag');

const BackToAdminHome = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const role = sessionStorage.getItem('staff_role') || '';
  const target = ROLE_WORKSPACE[role] || '/admin/admin-workspace';

  if (!pathname.startsWith('/admin')) return null;
  if (HIDDEN_PATHS.includes(pathname)) return null;
  if (isDiagPage(pathname)) return null;
  // На самом кабинете кнопка не нужна
  if (pathname === target) return null;

  return (
    <button
      type="button"
      onClick={() => navigate(target)}
      title="Вернуться в кабинет"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-3.5 py-2.5 text-sm font-medium text-gray-600 shadow-lg backdrop-blur transition-colors hover:border-green-400 hover:text-green-700 print:hidden"
    >
      <Icon name="LayoutGrid" size={16} />
      В кабинет
    </button>
  );
};

export default BackToAdminHome;