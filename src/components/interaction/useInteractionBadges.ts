import { useEffect, useState } from 'react';
import { DialogItem, fetchDialogs } from '@/lib/interactionsApi';

// Считает бейджи для кнопки «Окно взаимодействия»:
//   newAssigned — новые чаты, где текущего сотрудника назначили ответственным (⭐)
//   unread      — непрочитанные сообщения в чатах сотрудника (✉️)
export function useInteractionBadges() {
  const currentUser = sessionStorage.getItem('staff_name') || '';
  const [dialogs, setDialogs] = useState<DialogItem[]>([]);

  useEffect(() => {
    let stop = false;
    const load = () => {
      if (document.visibilityState !== 'visible') return;
      fetchDialogs().then((list) => {
        if (!stop) setDialogs(list);
      });
    };
    load();
    const t = setInterval(load, 30000);
    document.addEventListener('visibilitychange', load);
    return () => {
      stop = true;
      clearInterval(t);
      document.removeEventListener('visibilitychange', load);
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

  const newAssigned = dialogs.filter((d) => isMine(d) && !seen.includes(d.id)).length;
  const unread = dialogs.filter(isMine).reduce((sum, d) => sum + (d.unread || 0), 0);

  return { newAssigned, unread };
}
