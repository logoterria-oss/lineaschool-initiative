import { useEffect, useState } from 'react';
import { OnShiftAdmin, fetchOnShiftNow } from '@/lib/adminShiftsApi';

/** Событие «смена изменилась» — по нему список дежурных обновляется мгновенно. */
export const SHIFT_CHANGED = 'shift:changed';

export function notifyShiftChanged() {
  window.dispatchEvent(new Event(SHIFT_CHANGED));
}

/**
 * Кто из администраторов прямо сейчас на смене.
 * Список нужен «Окну взаимодействия», чтобы знать, кому распределять обращения.
 */
export function useOnShiftAdmins() {
  const [admins, setAdmins] = useState<OnShiftAdmin[]>([]);

  useEffect(() => {
    let stop = false;
    const load = () => {
      fetchOnShiftNow().then((list) => {
        if (!stop) setAdmins(list);
      });
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };

    load();
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 30000);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener(SHIFT_CHANGED, load);
    return () => {
      stop = true;
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener(SHIFT_CHANGED, load);
    };
  }, []);

  return admins;
}
