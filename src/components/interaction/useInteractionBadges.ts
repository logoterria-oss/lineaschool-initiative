import { useEffect, useState } from 'react';
import { DialogItem, fetchDialogs } from '@/lib/interactionsApi';

// Событие, которое шлёт окно взаимодействия при любом изменении
// (открыли чат, передали ответственного, отправили сообщение).
export const INTERACTION_CHANGED = 'interaction:changed';

export function notifyInteractionChanged() {
  window.dispatchEvent(new Event(INTERACTION_CHANGED));
}

// Считает бейджи для кнопки «Окно взаимодействия»:
//   newAssigned — новые чаты, где текущего сотрудника назначили ответственным (⭐)
//   unread      — непрочитанные сообщения в чатах сотрудника (✉️)
//
// Обновляется только когда есть что обновлять: при первом монтировании,
// при возврате на вкладку и при событии изменения внутри окна взаимодействия.
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
    // Лёгкий фоновый опрос — чтобы бейдж непрочитанных появлялся, когда клиент
    // прислал новое сообщение (входящие приходят через вебхук, не событием на клиенте).
    // Опрашиваем только при активной вкладке — в фоне запросы не шлём.
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 20000);
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

  const isMine = (d: DialogItem) =>
    !!currentUser && d.assignee.trim().toLowerCase() === currentUser.trim().toLowerCase();

  let seen: number[] = [];
  try {
    seen = JSON.parse(localStorage.getItem(`interaction_seen_assigned_${currentUser}`) || '[]');
  } catch {
    seen = [];
  }
  // seenVersion форсит пересчёт после отметки чата прочитанным.
  void seenVersion;

  const newAssigned = dialogs.filter((d) => isMine(d) && !seen.includes(d.id)).length;
  const unread = dialogs.filter(isMine).reduce((sum, d) => sum + (d.unread || 0), 0);

  return { newAssigned, unread };
}