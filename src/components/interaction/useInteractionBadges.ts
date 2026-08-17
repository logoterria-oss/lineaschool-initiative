import { useEffect, useState } from 'react';
import { DialogItem, fetchDialogs } from '@/lib/interactionsApi';

// Событие для принудительного обновления счётчиков.
export const INTERACTION_CHANGED = 'interaction:changed';

export function notifyInteractionChanged() {
  window.dispatchEvent(new Event(INTERACTION_CHANGED));
}

// Ключ сотрудника: «Фамилия Имя» в нижнем регистре, без отчества и роли в скобках.
// Имя в профиле — «Фамилия Имя Отчество», а ответственный хранится как «Фамилия Имя (роль)».
const staffKey = (name: string) =>
  (name || '')
    .replace(/\(.*?\)/g, '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ');

const sameStaff = (a: string, b: string) => {
  const ka = staffKey(a);
  const kb = staffKey(b);
  return !!ka && ka === kb;
};

const seenKey = (user: string) => `interaction_seen_assigned_${user}`;

const readSeen = (user: string): number[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(seenKey(user)) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

// Счётчики для кнопки «Окно взаимодействия». Данные берём из внешнего окна:
//   newAssigned — чаты, где сотрудника назначили ответственным и он их ещё не открывал (звёздочка)
//   unread      — непрочитанные сообщения в чатах, где сотрудник ответственный (конверт)
export function useInteractionBadges() {
  const currentUser = sessionStorage.getItem('staff_name') || '';
  const [dialogs, setDialogs] = useState<DialogItem[]>([]);
  const [seenVersion, setSeenVersion] = useState(0);

  useEffect(() => {
    let stop = false;
    const load = () => {
      fetchDialogs().then((list) => {
        if (!stop) setDialogs(list);
      });
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    const onChanged = () => {
      setSeenVersion((v) => v + 1);
      load();
    };

    load();
    // Обновляем регулярно: сообщения приходят во внешнем окне, событий на нашей
    // странице нет. В фоне вкладки запросы не шлём.
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 15000);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    window.addEventListener(INTERACTION_CHANGED, onChanged);
    return () => {
      stop = true;
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener(INTERACTION_CHANGED, onChanged);
    };
  }, []);

  const isMine = (d: DialogItem) => sameStaff(d.assignee, currentUser);
  const mine = dialogs.filter(isMine);

  // Какие чаты сотрудник уже видел. Отметки окна взаимодействия нам недоступны
  // (это другой сайт), поэтому ведём свой список и обновляем его при переходе туда.
  void seenVersion;
  const seen = readSeen(currentUser);

  const newAssigned = mine.filter((d) => !seen.includes(d.id)).length;
  const unread = mine.reduce((sum, d) => sum + (d.unread || 0), 0);

  /** Вызывать при открытии окна: назначенные чаты перестают считаться новыми. */
  const markAssignedSeen = () => {
    localStorage.setItem(seenKey(currentUser), JSON.stringify(mine.map((d) => d.id)));
    setSeenVersion((v) => v + 1);
  };

  return { newAssigned, unread, markAssignedSeen };
}