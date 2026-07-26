import { useCallback, useEffect, useState } from 'react';
import func2url from '../../../backend/func2url.json';

const API_URL = (func2url as Record<string, string>)['recurring-payments'];

export interface RecurringPayment {
  id: number;
  title: string;
  category: string;
  amount: number;
  period_months: number;
  next_date: string;
  note: string;
  is_active: boolean;
}

export interface PaymentDraft {
  id?: number;
  title: string;
  category: string;
  amount: number | '';
  period_months: number;
  next_date: string;
  note: string;
  is_active: boolean;
}

export const CATEGORIES = [
  'ПО для уроков',
  'ПО для сайта',
  'ПО для мессенджера',
  'Ведение бизнеса',
  'Интернет и телефония',
];

export const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  'ПО для уроков': { icon: 'BookOpen', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  'ПО для сайта': { icon: 'Globe', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  'ПО для мессенджера': { icon: 'MessageCircle', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  'Ведение бизнеса': { icon: 'Briefcase', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  'Интернет и телефония': { icon: 'Wifi', color: 'bg-rose-100 text-rose-700 border-rose-200' },
};

export function periodLabel(months: number): string {
  if (months === 1) return 'Ежемесячно';
  if (months === 12) return 'Раз в год';
  if (months === 3) return 'Раз в квартал';
  if (months === 6) return 'Раз в полгода';
  return `Раз в ${months} мес.`;
}

export function useRecurringPayments() {
  const [items, setItems] = useState<RecurringPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const pwd = () => sessionStorage.getItem('admin_password') || '';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
      setItems(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async (draft: PaymentDraft) => {
    setSaving(true);
    try {
      const method = draft.id ? 'PUT' : 'POST';
      const res = await fetch(API_URL, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': pwd() },
        body: JSON.stringify({
          ...draft,
          amount: draft.amount === '' ? 0 : draft.amount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось сохранить');
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
      return false;
    } finally {
      setSaving(false);
    }
  }, [load]);

  const markPaid = useCallback(async (id: number) => {
    const res = await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Password': pwd() },
      body: JSON.stringify({ id, mark_paid: true }),
    });
    if (res.ok) await load();
  }, [load]);

  const remove = useCallback(async (id: number) => {
    const res = await fetch(API_URL, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Password': pwd() },
      body: JSON.stringify({ id }),
    });
    if (res.ok) await load();
  }, [load]);

  return { items, loading, error, saving, save, markPaid, remove, reload: load };
}
