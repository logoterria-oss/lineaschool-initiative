import { useEffect, useState } from 'react';

const GET_REPORT_URL = 'https://functions.poehali.dev/ccdf6e9e-8ab6-450b-a327-e0afd0a8a31c';

/**
 * Режим редактирования сохранённого заключения.
 * Кнопка «Изменить» в админке открывает форму со ссылкой ?edit=ID —
 * отсюда подтягиваем сохранённые данные и подставляем их в форму.
 */
export function useEditReport<T>(onLoaded: (formData: T) => void) {
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // В ссылке может быть короткий код (новые заключения) или номер (старые).
    // Ведущие нули кода важны, поэтому ключ держим строкой.
    const key = (new URLSearchParams(window.location.search).get('edit') || '').trim();
    if (!/^\d+$/.test(key)) return;

    setLoading(true);

    fetch(`${GET_REPORT_URL}?id=${key}`)
      .then((r) => r.json())
      .then((data) => {
        const fd = data?.form_data ?? data?.formData;
        if (!fd) {
          setError('Не удалось загрузить заключение');
          return;
        }
        // Для перезаписи нужен настоящий номер записи, а не код из ссылки
        if (typeof data?.id === 'number') setEditId(data.id);
        onLoaded(typeof fd === 'string' ? JSON.parse(fd) : fd);
      })
      .catch(() => setError('Не удалось загрузить заключение'))
      .finally(() => setLoading(false));
    // Загружаем один раз при открытии формы
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { editId, loading, error, isEditing: editId !== null };
}