export interface PayLink {
  label: string;
  url: string;
}

/** Страницы оплаты на сайте — их отправляют родителям */
export const PAY_LINKS: PayLink[] = [
  { label: 'Первичная диагностика', url: 'https://lineaschool.ru/pay/diagnostika' },
  {
    label: 'Промежуточная диагностика',
    url: 'https://lineaschool.ru/pay/diagnostika-promezhutochnaya',
  },
  { label: '2 урока в неделю', url: 'https://lineaschool.ru/pay/abonement-2' },
  { label: '3 урока в неделю', url: 'https://lineaschool.ru/pay/abonement-3' },
  { label: '4 урока в неделю', url: 'https://lineaschool.ru/pay/abonement-4' },
  { label: 'Индивидуально', url: 'https://lineaschool.ru/pay/individual' },
  {
    label: 'Архивный 2 урока в неделю (1 инд + 1 гр)',
    url: 'https://lineaschool.ru/pay/abonement-archive-2',
  },
];

const BY_WEEK: Record<number, string> = {
  2: 'https://lineaschool.ru/pay/abonement-2',
  3: 'https://lineaschool.ru/pay/abonement-3',
  4: 'https://lineaschool.ru/pay/abonement-4',
};

/**
 * Ссылка на оплату по абонементу ученика из CRM.
 * Архивная линейка «2 урока в неделю» продлевается своей страницей —
 * цена там другая, обычная ссылка увела бы родителя на новый тариф.
 * Не разобрали название абонемента — ссылку не придумываем.
 */
export const payLinkForTariff = (
  tariff: { name?: string; per_week?: number | null; is_archived?: boolean } | null,
): PayLink | null => {
  if (!tariff) return null;
  const perWeek = tariff.per_week ?? null;

  if (tariff.is_archived && perWeek === 2) {
    return PAY_LINKS.find((l) => l.url.endsWith('abonement-archive-2')) || null;
  }
  if (perWeek && BY_WEEK[perWeek]) {
    const url = BY_WEEK[perWeek];
    return PAY_LINKS.find((l) => l.url === url) || null;
  }
  if (/индивид/i.test(tariff.name || '')) {
    return PAY_LINKS.find((l) => l.url.endsWith('individual')) || null;
  }
  return null;
};

/** Копирование ссылки в буфер: clipboard, а где его нет — старым способом */
export const copyToClipboard = async (url: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch {
    /* clipboard недоступен — пробуем запасной путь */
  }
  const ta = document.createElement('textarea');
  ta.value = url;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '0';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, url.length);
  const ok = document.execCommand('copy');
  document.body.removeChild(ta);
  return ok;
};

export default PAY_LINKS;
