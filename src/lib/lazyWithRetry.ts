import { ComponentType, lazy } from 'react';

/**
 * Ленивая загрузка страницы с повтором.
 *
 * Страницы подгружаются по одной, уже после открытия сайта. Если в этот
 * момент моргнула сеть или вышло обновление (старые файлы заменились
 * новыми), браузер отдаёт «Failed to fetch dynamically imported module»
 * и пользователь видит пустой экран.
 *
 * Поэтому пробуем ещё раз, а если не помогло — один раз перезагружаем
 * страницу: после обновления сайта это подтягивает свежую версию.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      // Вторая попытка: помогает при разовом сбое сети
      await new Promise((r) => setTimeout(r, 600));
      try {
        return await factory();
      } catch {
        const KEY = 'chunk_reload_at';
        const last = Number(sessionStorage.getItem(KEY) || 0);
        // Перезагружаем не чаще раза в 10 секунд, чтобы не зациклиться
        if (Date.now() - last > 10000) {
          sessionStorage.setItem(KEY, String(Date.now()));
          window.location.reload();
          // Пока идёт перезагрузка — отдаём пустую заглушку
          return { default: (() => null) as unknown as T };
        }
        throw err;
      }
    }
  });
}
