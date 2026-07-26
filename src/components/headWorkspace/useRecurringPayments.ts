import { useCallback, useEffect, useState } from 'react';
import func2url from '../../../backend/func2url.json';

const API_URL = (func2url as Record<string, string>)['recurring-payments'];

export type AmountType = 'fixed' | 'percent';

export interface RecurringPayment {
  id: number;
  title: string;
  category: string;
  amount: number;
  period_months: number;
  next_date: string;
  note: string;
  is_active: boolean;
  last_paid_at: string | null;
  amount_type: AmountType;
  percent: number;
  income_period: string;
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
  amount_type: AmountType;
  percent: number | '';
  income_period: string;
}

export const CATEGORIES = [
  'ПО для уроков',
  'ПО для сайта',
  'ПО для мессенджера',
  'Ведение бизнеса',
  'Интернет и телефония',
  'Страховые и налоги ИП',
];

export const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  'ПО для уроков': { icon: 'BookOpen', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  'ПО для сайта': { icon: 'Globe', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  'ПО для мессенджера': { icon: 'MessageCircle', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  'Ведение бизнеса': { icon: 'Briefcase', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  'Интернет и телефония': { icon: 'Wifi', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  'Страховые и налоги ИП': { icon: 'Landmark', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
};

/** Текст суммы платежа: фиксированная либо процент от дохода. */
export function amountLabel(p: RecurringPayment): string {
  if (p.amount_type === 'percent') {
    const base = `${p.percent}% от дохода`;
    return p.income_period ? `${base} (${p.income_period})` : base;
  }
  return p.amount.toLocaleString('ru-RU') + ' ₽';
}

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

  const pwd = () => sessionStorage.getItem('admin_password') || '426874';

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

  const unmarkPaid = useCallback(async (id: number) => {
    const res = await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Password': pwd() },
      body: JSON.stringify({ id, unmark_paid: true }),
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

  return { items, loading, error, saving, save, markPaid, unmarkPaid, remove, reload: load };
}

export type PaymentStatus = 'overdue' | 'due-soon' | 'paid' | 'pending';

export const DUE_SOON_DAYS = 7;

/**
 * Статус платежа.
 *
 * Когда пользователь нажимает «Отметить оплату», бэкенд ставит last_paid_at = сегодня
 * и сдвигает next_date на один период вперёд. Значит, платёж за текущий цикл закрыт,
 * а next_date — это уже следующая (будущая) дата оплаты.
 *
 * Поэтому платёж считается «Оплачено», пока по нему есть отметка об оплате (last_paid_at)
 * и до следующей даты оплаты ещё далеко (> 7 дней). Как только до next_date остаётся
 * ≤ 7 дней или она прошла — платёж снова требует оплаты (due-soon / overdue),
 * даже если last_paid_at заполнен от прошлого цикла.
 */
export function paymentStatus(p: RecurringPayment): PaymentStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(p.next_date + 'T00:00:00');
  const days = Math.round((next.getTime() - today.getTime()) / 86400000);

  if (days < 0) return 'overdue';
  if (days <= DUE_SOON_DAYS) return 'due-soon';

  // До оплаты далеко: если по платежу уже есть отметка об оплате — он закрыт.
  if (p.last_paid_at) return 'paid';

  return 'pending';
}

/**
 * Нужно ли платить в текущем календарном месяце: дата платежа приходится
 * на этот месяц (или уже просрочена) и платёж ещё не оплачен.
 * Используется, чтобы в начале месяца сразу видеть список и сумму к оплате.
 */
export function dueThisMonth(p: RecurringPayment): boolean {
  if (paymentStatus(p) === 'paid') return false;
  const today = new Date();
  const next = new Date(p.next_date + 'T00:00:00');
  if (next < today) return true; // просроченные всегда попадают
  return (
    next.getFullYear() === today.getFullYear() &&
    next.getMonth() === today.getMonth()
  );
}