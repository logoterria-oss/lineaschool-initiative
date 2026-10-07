// Запоминаем, с какой рекламы пришёл посетитель (UTM-метки), чтобы
// передать их вместе с заявкой. Человек может зайти по рекламе, уйти
// и вернуться позже напрямую — поэтому метки храним 30 дней.
// Новый заход с другими UTM перезаписывает старые (модель «последний рекламный клик»).

const KEY = 'linea_utm';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

export interface UtmData {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  landing_page: string;
  referrer: string;
}

interface Stored extends UtmData {
  saved_at: number;
}

const EMPTY: UtmData = {
  utm_source: '', utm_medium: '', utm_campaign: '', utm_content: '', utm_term: '',
  landing_page: '', referrer: '',
};

function externalReferrer(): string {
  const ref = document.referrer || '';
  try {
    if (ref && new URL(ref).host === window.location.host) return '';
  } catch {
    return '';
  }
  return ref.slice(0, 500);
}

export function captureUtm(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const hasUtm = UTM_KEYS.some((k) => params.get(k));
    // Клики из Яндекс.Директа без UTM помечаем по yclid
    const yclid = params.get('yclid');
    if (!hasUtm && !yclid) {
      // Без меток: если ничего не сохранено — запоминаем хотя бы внешний источник перехода
      if (!localStorage.getItem(KEY)) {
        const ref = externalReferrer();
        if (ref) {
          const data: Stored = { ...EMPTY, referrer: ref, landing_page: window.location.pathname, saved_at: Date.now() };
          localStorage.setItem(KEY, JSON.stringify(data));
        }
      }
      return;
    }
    const data: Stored = {
      utm_source: (params.get('utm_source') || (yclid ? 'yandex' : '')).slice(0, 200),
      utm_medium: (params.get('utm_medium') || (yclid ? 'cpc' : '')).slice(0, 200),
      utm_campaign: (params.get('utm_campaign') || '').slice(0, 200),
      utm_content: (params.get('utm_content') || '').slice(0, 200),
      utm_term: (params.get('utm_term') || '').slice(0, 200),
      landing_page: (window.location.pathname + window.location.search).slice(0, 500),
      referrer: externalReferrer(),
      saved_at: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // localStorage недоступен (приватный режим) — просто не трекаем
  }
}

export function getUtm(): UtmData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const data = JSON.parse(raw) as Stored;
    if (!data.saved_at || Date.now() - data.saved_at > TTL_MS) {
      localStorage.removeItem(KEY);
      return { ...EMPTY };
    }
    const { saved_at: _ignored, ...rest } = data;
    return { ...EMPTY, ...rest };
  } catch {
    return { ...EMPTY };
  }
}
