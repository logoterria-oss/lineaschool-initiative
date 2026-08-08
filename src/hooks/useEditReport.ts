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
    const raw = new URLSearchParams(window.location.search).get('edit');
    const id = raw ? parseInt(raw, 10) : NaN;
    if (!Number.isFinite(id)) return;

    setEditId(id);
    setLoading(true);

    fetch(`${GET_REPORT_URL}?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        const fd = data?.form_data ?? data?.formData;
        if (!fd) {
          setError('Не удалось загрузить заключение');
          return;
        }
        onLoaded(typeof fd === 'string' ? JSON.parse(fd) : fd);
      })
      .catch(() => setError('Не удалось загрузить заключение'))
      .finally(() => setLoading(false));
    // Загружаем один раз при открытии формы
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { editId, loading, error, isEditing: editId !== null };
}
