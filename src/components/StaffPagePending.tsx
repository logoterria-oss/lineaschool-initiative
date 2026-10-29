/**
 * Что сервер отдаёт на страницах кабинета сотрудников: сам кабинет
 * рисуется только в браузере (вход хранится в браузере), а до этого
 * виден тот же индикатор загрузки, что и раньше при подгрузке страницы.
 */
const StaffPagePending = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-green-500 animate-spin" />
    <span className="sr-only">Загрузка кабинета сотрудника ЛинэяСкул…</span>
  </div>
);

export default StaffPagePending;
