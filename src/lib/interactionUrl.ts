/** Внешнее «Окно взаимодействия» — открывается отдельной вкладкой браузера */
export const INTERACTION_URL = 'https://okno-vzaimodejstviya--preview.poehali.dev/interaction';

/** Его же сервер — оттуда берём счётчики для кнопки */
export const INTERACTION_API_URL =
  'https://functions.poehali.dev/67e8d62d-902a-4e5e-9862-d18395a730b1';

/**
 * Открытый адрес со списком админов, которые прямо сейчас на смене.
 * «Окно взаимодействия» опрашивает его, чтобы знать, кому распределять обращения.
 */
export const ON_SHIFT_FEED_URL =
  'https://functions.poehali.dev/83e343d0-ee38-4e33-94eb-f28c8514f37c?action=on-shift';

/**
 * Ссылка в «Окно взаимодействия» со списком дежурных админов в адресе —
 * так окно узнаёт о смене сразу при переходе, не дожидаясь опроса.
 */
export const buildInteractionUrl = (onShiftIds: number[]): string => {
  if (onShiftIds.length === 0) return INTERACTION_URL;
  const q = new URLSearchParams({ on_shift: onShiftIds.join(',') });
  return `${INTERACTION_URL}?${q.toString()}`;
};
