import { useState, useCallback } from 'react';

interface Dictation {
  id: number;
  child_name: string;
  annotated_image: string | null;
  created_at: string;
  checked_at: string | null;
}

export function useDictationLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dictations, setDictations] = useState<Dictation[]>([]);

  const loadCheckedDictations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        'https://functions.poehali.dev/94ceb881-6ad6-4eff-8d2c-2975261768a0'
      );

      if (!response.ok) {
        throw new Error('Ошибка при загрузке диктантов');
      }

      const data = await response.json();
      
      // Фильтруем только проверенные диктанты с разметкой
      const checked = (data.dictations || []).filter(
        (d: any) => d.status === 'checked' && d.has_annotation
      );
      
      setDictations(checked);
      return checked;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDictationImage = useCallback(async (dictationId: number): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://functions.poehali.dev/94ceb881-6ad6-4eff-8d2c-2975261768a0?id=${dictationId}`
      );

      if (!response.ok) {
        throw new Error('Ошибка при загрузке изображения');
      }

      const data = await response.json();
      return data.dictation?.annotated_image || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки изображения');
      return null;
    }
  }, []);

  return { loadCheckedDictations, loadDictationImage, dictations, isLoading, error };
}
