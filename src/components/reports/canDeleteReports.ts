import { useEffect, useState } from 'react';
import { fetchMe } from '@/lib/staffApi';

// Удалять заключения может только руководитель школы — Абраменко Виктория.
// Это лишь скрытие кнопки в интерфейсе: настоящая проверка идёт на сервере
// по токену сессии, поэтому обойти запрет через браузер нельзя.
export function isDeleteAllowedFor(role: string | null, fullName: string | null): boolean {
  const name = (fullName || '').trim().toLowerCase();
  return role === 'head' && name.includes('абраменко');
}

export function canDeleteReports(): boolean {
  return isDeleteAllowedFor(
    sessionStorage.getItem('staff_role'),
    sessionStorage.getItem('staff_name'),
  );
}

/**
 * Право на удаление с дозагрузкой профиля.
 * Имя сотрудника попадает в сессию не мгновенно, поэтому при его отсутствии
 * запрашиваем профиль — иначе кнопка пропала бы у самой Виктории.
 */
export function useCanDeleteReports(): boolean {
  const [allowed, setAllowed] = useState(canDeleteReports);

  useEffect(() => {
    if (allowed) return;
    if (sessionStorage.getItem('staff_name')) return;

    let cancelled = false;
    fetchMe()
      .then((staff) => {
        if (cancelled || !staff) return;
        sessionStorage.setItem('staff_name', staff.full_name);
        sessionStorage.setItem('staff_role', staff.role);
        setAllowed(isDeleteAllowedFor(staff.role, staff.full_name));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  return allowed;
}
