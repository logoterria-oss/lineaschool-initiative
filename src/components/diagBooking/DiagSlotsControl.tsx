import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import DiagSlotsDialog from './DiagSlotsDialog';
import { fetchDiagCoverage } from '@/lib/diagBookingApi';

const SEEN_KEY = 'diag_slots_reminder_seen';
const CHECK_EVERY_MS = 60 * 60 * 1000;

/**
 * Кнопка «+» у руководителя (рядом с «На смене») и напоминания про окна диагностик:
 * по воскресеньям — обновить окна, в любой день — если окон нет на 2 недели вперёд.
 * Каждое напоминание показываем один раз в день.
 */
const DiagSlotsControl = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const check = useCallback(async () => {
    const cov = await fetchDiagCoverage();
    if (!cov) return;
    const kind = !cov.enough ? 'short' : cov.isSunday ? 'sunday' : '';
    if (!kind) return;
    const key = `${cov.today}:${kind}`;
    if (localStorage.getItem(SEEN_KEY) === key) return;
    localStorage.setItem(SEEN_KEY, key);

    const parts: string[] = [];
    if (cov.isSunday) parts.push('Не забудь обновить слоты для диагностик ❤️');
    if (!cov.enough) {
      parts.push(
        cov.lastSlotDateRu
          ? `Окна для диагностик заведены только до ${cov.lastSlotDateRu} — нужно на 2 недели вперёд.`
          : 'Окон для диагностик на ближайшие 2 недели нет.',
      );
    }
    toast({
      title: cov.isSunday ? parts[0] : 'Обнови слоты для диагностик ❤️',
      description: cov.isSunday ? parts[1] : parts[0],
      action: (
        <ToastAction altText="Открыть окна" onClick={() => setOpen(true)}>
          Открыть
        </ToastAction>
      ),
    });
  }, [toast]);

  useEffect(() => {
    check();
    const id = setInterval(check, CHECK_EVERY_MS);
    return () => clearInterval(id);
  }, [check]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Окна для диагностик"
        className="mt-2 shrink-0 w-10 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
      >
        <Icon name="Plus" size={18} />
      </button>
      <DiagSlotsDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default DiagSlotsControl;
