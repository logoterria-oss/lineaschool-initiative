import { useEffect, useState } from 'react';
import { DiagData } from '@/types/DiagData';

export function useDiagData(serialNumber: string | undefined) {
  const [diagData, setDiagData] = useState<DiagData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = () => {
      try {
        console.log('DiagConclusion: Starting data load...');
        console.log('Serial Number:', serialNumber);
        console.log('User Agent:', navigator.userAgent);
        console.log('localStorage available:', typeof Storage !== "undefined");
        
        // Проверяем доступность localStorage
        if (typeof Storage === "undefined") {
          throw new Error('localStorage not supported');
        }
        
        const savedData = localStorage.getItem('diagData');
        console.log('Raw localStorage data:', savedData);
        console.log('Data length:', savedData?.length || 0);
        
        if (savedData && savedData.trim().length > 0) {
          try {
            const parsedData = JSON.parse(savedData);
            console.log('Successfully parsed data:', Object.keys(parsedData));
            console.log('Child name from data:', parsedData.childName);
            
            // Проверяем, что данные валидны
            if (typeof parsedData === 'object' && parsedData !== null) {
              setDiagData(parsedData);
              setError(null);
            } else {
              throw new Error('Неверный формат данных');
            }
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            setError('Данные повреждены. Пожалуйста, заполните форму заново.');
          }
        } else {
          console.warn('No data found in localStorage');
          setError('Данные диагностики не найдены. Возможно, браузер находится в приватном режиме или заблокировано хранилище.');
        }
      } catch (err) {
        console.error('Data loading error:', err);
        setError(`Ошибка при загрузке данных: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
      } finally {
        setLoading(false);
      }
    };

    // Добавляем небольшую задержку для мобильных устройств
    const timer = setTimeout(loadData, 100);
    return () => clearTimeout(timer);
  }, [serialNumber]);

  return { diagData, loading, error };
}