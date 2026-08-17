import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMe, Staff, StaffRole } from './staffApi';

/** Куда отправлять сотрудника с его ролью */
export const homePathForRole = (role: StaffRole): string => {
  switch (role) {
    case 'head': return '/admin/head-workspace';
    case 'diag': return '/admin/diag';
    case 'teacher': return '/admin/teacher-lk';
    case 'admin': return '/admin/admin-workspace';
    default: return '/admin/home';
  }
};

/**
 * Пускает в кабинет только сотрудника с нужной ролью.
 * Роль берём с сервера — данные в браузере могут быть от другого входа
 * (например, в соседней вкладке вошли под другим сотрудником).
 * Чужая роль — сразу переносим в его собственный кабинет.
 */
export function useRoleGuard(allowed: StaffRole) {
  const navigate = useNavigate();
  const [me, setMe] = useState<Staff | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let stop = false;

    const check = async () => {
      const staff = await fetchMe();
      if (stop) return;

      if (!staff) {
        sessionStorage.removeItem('staff_role');
        sessionStorage.removeItem('staff_name');
        navigate('/admin', { replace: true });
        return;
      }

      sessionStorage.setItem('staff_name', staff.full_name);
      sessionStorage.setItem('staff_role', staff.role);

      if (staff.role !== allowed) {
        setChecking(false);
        navigate(homePathForRole(staff.role), { replace: true });
        return;
      }

      setMe(staff);
      setChecking(false);
    };

    check();
    // Вернулись на вкладку — проверяем снова: вход мог смениться в другой вкладке.
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      stop = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  return { me, checking };
}
