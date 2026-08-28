import { useState } from 'react';

/** Копирование в буфер обмена с запасным путём для старых браузеров */
export const useCopy = () => {
  const [copiedId, setCopiedId] = useState<number | string | null>(null);

  const copy = async (text: string, id: number | string = 'default') => {
    let ok = false;
    try {
      // Работает только на https и по явному клику
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      document.body.removeChild(area);
    }

    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      // Совсем не вышло — показываем ссылку, чтобы скопировать вручную
      prompt('Скопируйте ссылку:', text);
    }
  };

  return { copiedId, copy };
};
