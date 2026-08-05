// Удалять заключения может только руководитель школы — Абраменко Виктория.
// Это лишь скрытие кнопки в интерфейсе: настоящая проверка идёт на сервере
// по токену сессии, поэтому обойти запрет через браузер нельзя.
export function canDeleteReports(): boolean {
  const role = sessionStorage.getItem('staff_role');
  const name = (sessionStorage.getItem('staff_name') || '').trim().toLowerCase();
  return role === 'head' && name.includes('абраменко');
}
