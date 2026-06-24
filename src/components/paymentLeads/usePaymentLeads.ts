import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { namesSimilar } from '@/lib/nameSimilarity';
import { PaymentLead, BlockedPayment, GET_LEADS_URL, SYNC_URL, DELETE_URL, BLOCKLIST_URL } from './types';

export function usePaymentLeads() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHead = location.state?.from === '/admin/head';
  const [leads, setLeads] = useState<PaymentLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'day' | 'month'>('month');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [showReport, setShowReport] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [tab, setTab] = useState<'active' | 'blocked'>('active');
  const [blocked, setBlocked] = useState<BlockedPayment[]>([]);
  const [unblockingId, setUnblockingId] = useState<number | null>(null);

  useEffect(() => {
    // При открытии страницы — сначала тихо синхронизируем, потом загружаем список
    fetch(SYNC_URL).catch(() => {});
    fetchLeads();
    fetchBlocked();
  }, []);

  const fetchBlocked = async () => {
    try {
      const response = await fetch(BLOCKLIST_URL);
      const data = await response.json();
      setBlocked(data.items || []);
    } catch (error) {
      console.error('Error fetching blocklist:', error);
    }
  };

  const handleUnblock = async (item: BlockedPayment) => {
    if (!window.confirm(`Вернуть платёж «${item.name}» из чёрного списка? Он снова сможет появиться при синхронизации с почтой банка.`)) return;
    setUnblockingId(item.id);
    try {
      const password = sessionStorage.getItem('admin_password') || '';
      const resp = await fetch(BLOCKLIST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': password },
        body: JSON.stringify({ id: item.id }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setBlocked((prev) => prev.filter((b) => b.id !== item.id));
      } else {
        alert(data.error || 'Не удалось вернуть платёж');
      }
    } catch {
      alert('Ошибка соединения');
    } finally {
      setUnblockingId(null);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await fetch(GET_LEADS_URL);
      const data = await response.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const resp = await fetch(SYNC_URL);
      const data = await resp.json();
      if (data.ok) {
        const msg = data.matched > 0
          ? `Найдено новых оплат: ${data.matched}`
          : 'Новых оплат не найдено';
        setSyncResult(msg);
        await fetchLeads();
      } else {
        setSyncResult('Ошибка синхронизации');
      }
    } catch {
      setSyncResult('Не удалось подключиться к почте');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (lead: PaymentLead) => {
    if (!window.confirm(`Удалить оплату «${lead.name}» на ${lead.amount.toLocaleString('ru-RU')} ₽?`)) return;
    setDeletingId(lead.id);
    try {
      const password = sessionStorage.getItem('admin_password') || '';
      const resp = await fetch(DELETE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': password },
        body: JSON.stringify({ id: lead.id }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setLeads((prev) => prev.filter((l) => l.id !== lead.id));
        fetchBlocked();
      } else {
        alert(data.error || 'Не удалось удалить оплату');
      }
    } catch {
      alert('Ошибка соединения');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePaid = async (lead: PaymentLead) => {
    const markPaid = !lead.paid_at;
    const confirmMsg = markPaid
      ? `Отметить оплату «${lead.name}» на ${lead.amount.toLocaleString('ru-RU')} ₽ как оплаченную?`
      : `Вернуть оплату «${lead.name}» в статус «Ожидает оплаты»?`;
    if (!window.confirm(confirmMsg)) return;
    setTogglingId(lead.id);
    try {
      const password = sessionStorage.getItem('admin_password') || '';
      const resp = await fetch(DELETE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': password },
        body: JSON.stringify({ id: lead.id, action: markPaid ? 'mark_paid' : 'mark_unpaid' }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        await fetchLeads();
        fetchBlocked();
      } else {
        alert(data.error || 'Не удалось изменить статус');
      }
    } catch {
      alert('Ошибка соединения');
    } finally {
      setTogglingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const normalized = dateString.includes('+') || dateString.endsWith('Z') ? dateString : dateString + 'Z';
    return new Date(normalized).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Europe/Moscow',
    });
  };

  // Дедупликация: дублем считаем платёж с тем же тарифом и суммой за один день,
  // если ФИО совпадают с точностью до опечаток и лишних слов (нечёткое сравнение).
  // Из группы берём оплаченную, если есть, иначе последнюю по id.
  const deduplicated = (() => {
    // Кандидат лучше текущего, если он оплачен (а текущий нет) или новее по id
    const isBetter = (candidate: PaymentLead, current: PaymentLead) => {
      const cPaid = !!candidate.paid_at;
      const curPaid = !!current.paid_at;
      return (!curPaid && cPaid) || (curPaid === cPaid && candidate.id > current.id);
    };

    // Сначала грубо группируем по тарифу+сумме+дню, внутри — склеиваем по схожести ФИО
    const buckets = new Map<string, PaymentLead[]>();
    const mskDay = (iso: string) => {
      const normalized = iso.includes('+') || iso.endsWith('Z') ? iso : iso + 'Z';
      return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/Moscow' }).format(new Date(normalized));
    };

    for (const l of leads) {
      const dateDay = l.created_at ? mskDay(l.created_at) : '';
      const bucketKey = `${l.plan}__${l.amount}__${dateDay}`;
      const bucket = buckets.get(bucketKey);
      if (bucket) {
        const match = bucket.find((x) => namesSimilar(x.name, l.name));
        if (match) {
          if (isBetter(l, match)) Object.assign(match, l);
        } else {
          bucket.push({ ...l });
        }
      } else {
        buckets.set(bucketKey, [{ ...l }]);
      }
    }
    return Array.from(buckets.values()).flat();
  })();

  const toMskPrefix = (iso: string, mode: 'month' | 'day') => {
    const normalized = iso.includes('+') || iso.endsWith('Z') ? iso : iso + 'Z';
    const opts = mode === 'month'
      ? { year: 'numeric', month: '2-digit', timeZone: 'Europe/Moscow' } as const
      : { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/Moscow' } as const;
    const parts = new Intl.DateTimeFormat('en-CA', opts).formatToParts(new Date(normalized));
    const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return mode === 'month' ? `${map.year}-${map.month}` : `${map.year}-${map.month}-${map.day}`;
  };

  const filtered = deduplicated
    .filter((l) => {
      // Для оплаченных фильтруем по дате оплаты, для ожидающих — по дате заявки
      const baseDate = l.paid_at || l.created_at;
      if (!baseDate) return false;
      return toMskPrefix(baseDate, dateFilter) === selectedDate;
    })
    .sort((a, b) => {
      // Новые сверху, ранние внизу — по дате оплаты (или заявки)
      const da = new Date(a.paid_at || a.created_at || 0).getTime();
      const db = new Date(b.paid_at || b.created_at || 0).getTime();
      return db - da;
    });

  const paidCount = filtered.filter((l) => !!l.paid_at).length;
  const unpaidCount = filtered.filter((l) => !l.paid_at).length;

  return { navigate, isHead, loading, syncing, syncResult, dateFilter, setDateFilter, selectedDate, setSelectedDate, showReport, setShowReport, showManual, setShowManual, deletingId, togglingId, tab, setTab, blocked, unblockingId, handleUnblock, handleSync, handleDelete, handleTogglePaid, formatDate, deduplicated, filtered, paidCount, unpaidCount, fetchLeads };
}
