import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Черновик формы в браузере.
 * Данные пишутся в localStorage, поэтому переживают закрытие вкладки,
 * обновление страницы и случайный переход назад.
 */

const PREFIX = 'diag-draft:';
/** Через сколько дней черновик считается протухшим */
const MAX_AGE_DAYS = 30;

export interface DraftMeta {
  savedAt: string;
  childName: string;
}

interface StoredDraft<T> {
  savedAt: string;
  childName: string;
  data: T;
}

function keyOf(formId: string) {
  return `${PREFIX}${formId}`;
}

function readDraft<T>(formId: string): StoredDraft<T> | null {
  try {
    const raw = localStorage.getItem(keyOf(formId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft<T>;
    if (!parsed?.savedAt) return null;

    // Старые черновики удаляем, чтобы не предлагать давно забытое
    const ageDays = (Date.now() - new Date(parsed.savedAt).getTime()) / 86400000;
    if (!Number.isFinite(ageDays) || ageDays > MAX_AGE_DAYS) {
      localStorage.removeItem(keyOf(formId));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraft(formId: string) {
  try {
    localStorage.removeItem(keyOf(formId));
  } catch {
    /* localStorage может быть недоступен — не критично */
  }
}

/** Человекочитаемое «сохранено 5 минут назад» */
export function formatSavedAt(iso: string): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return 'только что';
  if (diffMin < 60) return `${diffMin} мин назад`;

  const d = new Date(iso);
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) return `сегодня в ${time}`;

  return `${d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} в ${time}`;
}

interface Options<T> {
  /** Уникальный идентификатор формы: 'primary' или 'interim' */
  formId: string;
  /** Текущее состояние формы */
  data: T;
  /** Имя ребёнка — показываем в предложении продолжить */
  childName: string;
  /** Пустая ли форма: пустые черновики не сохраняем */
  isEmpty: (data: T) => boolean;
  /**
   * Выключает черновик целиком. Нужно в режиме правки сохранённого
   * заключения: там данные пришли из базы и не должны затирать
   * незаконченный черновик новой диагностики.
   */
  disabled?: boolean;
}

export function useFormDraft<T>({ formId, data, childName, isEmpty, disabled }: Options<T>) {
  // Черновик, найденный при открытии формы
  const [found, setFound] = useState<StoredDraft<T> | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  // Пока логопед не ответил на предложение — не перезаписываем черновик
  const paused = useRef(true);

  useEffect(() => {
    if (disabled) return;
    const draft = readDraft<T>(formId);
    if (draft && !isEmpty(draft.data)) {
      setFound(draft);
    } else {
      paused.current = false;
    }
    // Проверяем только при первом открытии формы
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, disabled]);

  // Автосохранение с задержкой, чтобы не писать на каждую букву
  useEffect(() => {
    if (disabled) return;
    if (paused.current) return;
    if (isEmpty(data)) return;

    const t = setTimeout(() => {
      try {
        const now = new Date().toISOString();
        const payload: StoredDraft<T> = { savedAt: now, childName, data };
        localStorage.setItem(keyOf(formId), JSON.stringify(payload));
        setSavedAt(now);
      } catch {
        /* переполнение хранилища — молча пропускаем */
      }
    }, 800);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, childName, formId, disabled]);

  /** Продолжить с места остановки */
  const restore = useCallback((): T | null => {
    const draft = found?.data ?? null;
    paused.current = false;
    setFound(null);
    return draft;
  }, [found]);

  /** Начать заново — черновик удаляем */
  const discard = useCallback(() => {
    clearDraft(formId);
    paused.current = false;
    setFound(null);
  }, [formId]);

  /** После успешного сохранения черновик больше не нужен */
  const finish = useCallback(() => {
    paused.current = true;
    clearDraft(formId);
    setSavedAt(null);
  }, [formId]);

  return {
    /** Найденный черновик — если есть, показываем предложение продолжить */
    draft: found ? { savedAt: found.savedAt, childName: found.childName } : null,
    savedAt,
    restore,
    discard,
    finish,
  };
}