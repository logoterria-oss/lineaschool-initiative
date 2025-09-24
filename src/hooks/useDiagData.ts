import { useEffect, useState } from 'react';
import { DiagData } from '@/types/DiagData';

export function useDiagData(serialNumber: string | undefined) {
  const [diagData, setDiagData] = useState<DiagData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('DiagConclusion: Starting data load...');
        console.log('Serial Number:', serialNumber);

        if (!serialNumber) {
          setError('ID заключения не указан');
          setLoading(false);
          return;
        }

        // Попытка загрузить данные из БД
        try {
          const response = await fetch(`https://functions.poehali.dev/a5ea21c2-fada-4606-b21f-00cd65c05b8c?id=${serialNumber}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.form_data) {
              console.log('✅ Данные загружены из базы данных');
              setDiagData(data.form_data);
              setError(null);
              setLoading(false);
              return;
            }
          } else if (response.status === 404) {
            console.warn('🔍 Заключение не найдено в БД, пробуем localStorage');
          } else {
            console.warn('⚠️ Ошибка загрузки из БД:', response.status);
          }
        } catch (fetchError) {
          console.warn('⚠️ Сетевая ошибка при загрузке из БД:', fetchError);
        }

        // Фоллбек - пробуем загрузить из localStorage (для совместимости)
        console.log('🔄 Пробуем загрузить из localStorage...');
        
        if (typeof Storage === "undefined") {
          throw new Error('localStorage not supported');
        }
        
        const savedData = localStorage.getItem('diagData');
        console.log('Raw localStorage data:', savedData);
        console.log('Data length:', savedData?.length || 0);
        
        if (savedData && savedData.trim().length > 0) {
          try {
            const parsedData = JSON.parse(savedData);
            console.log('✅ Данные загружены из localStorage');
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
          console.warn('❌ Данные не найдены ни в БД, ни в localStorage');
          setError('Заключение не найдено. Возможно, оно было удалено или ссылка неверна.');
        }
      } catch (err) {
        console.error('Data loading error:', err);
        setError(`Ошибка при загрузке данных: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [serialNumber]);

  return { diagData, loading, error };
}