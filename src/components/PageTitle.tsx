import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Названия вкладок браузера по адресу страницы.
 * Ключ — путь роута (как в App.tsx), значение — заголовок вкладки.
 * Страницы, которые ставят себе заголовок сами (прайс, отчёты,
 * заключения), сюда не добавляем — их значение перекроет наш.
 */
const TITLES: Record<string, string> = {
  '/lineastudies': 'ЛинэяСтадис — курсы для специалистов',
  '/oferta_2025': 'Договор оферты — ЛинэяСкул',
  '/privacy': 'Политика конфиденциальности — ЛинэяСкул',
  '/sveden': 'Сведения об образовательной организации — ЛинэяСкул',
  '/extension': 'Расширение — ЛинэяСкул',
  '/anketa': 'Анкета для родителей — ЛинэяСкул',
  '/diag_form': 'Диагностическая форма — ЛинэяСкул',
  '/interim_diag_form': 'Промежуточная диагностика — ЛинэяСкул',
  '/booking': 'Запись на занятие — ЛинэяСкул',

  '/admin': 'Выбор роли — ЛинэяСкул',
  '/admin/role-select': 'Выбор роли — ЛинэяСкул',
  '/admin/home': 'Рабочий стол — ЛинэяСкул',
  '/admin/diag': 'Диагностики — Админка',
  '/admin/teacher': 'Кабинет педагога — Админка',
  '/admin/teacher-lk': 'Личный кабинет педагога — Админка',
  '/admin/manager': 'Кабинет менеджера — Админка',
  '/admin/admin-workspace': 'Рабочее место администратора',
  '/admin/head': 'Кабинет руководителя — Админка',
  '/admin/head-workspace': 'Рабочее место руководителя',
  '/admin/head-reports': 'Отчёты педагогов — Админка',
  '/admin/head-supervisions': 'Супервизии — Админка',
  '/admin/head-violations': 'Нарушения — Админка',
  '/admin/head-staff-violations': 'Нарушения сотрудников — Админка',
  '/admin/regulations': 'Регламенты — Админка',
  '/admin/reports': 'Отчёты — Админка',
  '/admin/telegram-setup': 'Настройка Telegram — Админка',
  '/telegram-setup': 'Настройка Telegram — ЛинэяСкул',
  '/admin/questionnaires': 'Ответы на анкеты — Админка',
  '/admin/payment-leads': 'Заявки на оплату — Админка',
  '/admin/schedule': 'Расписание — Админка',
  '/admin/students': 'Ученики — Админка',
  '/admin/settings': 'Настройки — Админка',
  '/admin/staff': 'Сотрудники — Админка',
  '/admin/profile': 'Мой профиль — Админка',
};

const resolveTitle = (pathname: string): string | undefined => {
  const exact = TITLES[pathname];
  if (exact) return exact;

  // Адреса с параметром: /booking/:token и т.п.
  const prefix = Object.keys(TITLES).find(
    (p) => p !== '/' && pathname.startsWith(`${p}/`),
  );
  return prefix ? TITLES[prefix] : undefined;
};

/**
 * Ставит осмысленное название вкладки для страниц, которые не задают его сами.
 * Когда открыто много вкладок, руководитель различает их по названию, а не
 * по одинаковому «ЛинэяСкул».
 */
export default function PageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const title = resolveTitle(pathname);
    if (title) document.title = title;
  }, [pathname]);

  return null;
}
