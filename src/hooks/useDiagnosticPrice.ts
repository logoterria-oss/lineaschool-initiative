import { useEffect, useState } from 'react';
import {
  getNextPriceChange,
  getPrimaryDiagnosticPrice,
} from '@/lib/diagnosticPrice';

/**
 * Актуальная цена первичной диагностики. Если пользователь держит вкладку
 * открытой через момент смены цены, хук сам обновит её — таймер заведён ровно
 * на этот момент, перезагружать страницу не нужно.
 */
export function useDiagnosticPrice() {
  const [price, setPrice] = useState(() => getPrimaryDiagnosticPrice());

  useEffect(() => {
    const delay = getNextPriceChange();
    if (delay === null) return;
    // setTimeout не берёт задержку больше ~24 суток, поэтому ждём по кускам
    const step = Math.min(delay + 1000, 60 * 60 * 1000);
    const timer = setTimeout(() => setPrice(getPrimaryDiagnosticPrice()), step);
    return () => clearTimeout(timer);
  }, [price]);

  return price;
}
