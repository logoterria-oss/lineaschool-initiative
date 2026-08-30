import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface PayLink {
  label: string;
  url: string;
}

const PAY_LINKS: PayLink[] = [
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

const PayLinksView = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (url: string) => {
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, url.length);
      ok = document.execCommand('copy');
      document.body.removeChild(ta);
    }
    if (!ok) {
      window.prompt('Скопируйте ссылку:', url);
      return;
    }
    setCopied(url);
    setTimeout(() => setCopied((prev) => (prev === url ? null : prev)), 1500);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Ссылки на оплату</h2>
      <p className="text-sm text-gray-500 mb-5">
        Отправьте родителю нужную ссылку — она откроет страницу оплаты
      </p>

      <ul className="space-y-2">
        {PAY_LINKS.map((link) => (
          <li
            key={link.url}
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">{link.label}</p>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 hover:underline break-all"
              >
                {link.url}
              </a>
            </div>
            <button
              onClick={() => copy(link.url)}
              className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Icon name={copied === link.url ? 'Check' : 'Copy'} size={14} />
              {copied === link.url ? 'Скопировано' : 'Копировать'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PayLinksView;