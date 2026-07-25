import { useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  DialogItem,
  MessageItem,
  fetchDialogs,
  fetchMessages,
  sendMessage,
  assignDialog,
  resolveCrm,
  fetchAssignees,
  searchCrmContacts,
  createDialog,
  setContacts,
  CrmContact,
} from '@/lib/interactionsApi';
import DialogList from './DialogList';
import ChatPanel from './ChatPanel';
import DialogSidebar from './DialogSidebar';
import NewDialogModal from './NewDialogModal';
import { notifyInteractionChanged } from './useInteractionBadges';

const InteractionWindow = () => {
  const { toast } = useToast();
  const currentUser = sessionStorage.getItem('staff_name') || '';
  const [dialogs, setDialogs] = useState<DialogItem[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [newOpen, setNewOpen] = useState(false);
  const [crmQuery, setCrmQuery] = useState('');
  const [crmResults, setCrmResults] = useState<CrmContact[]>([]);
  const [crmSearching, setCrmSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [onlyMine, setOnlyMine] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<number | null>(null);
  activeIdRef.current = activeId;

  const active = dialogs.find((d) => d.id === activeId) || null;

  const loadDialogs = async () => {
    const list = await fetchDialogs();
    setDialogs(list);
    setLoading(false);
    if (activeIdRef.current === null && list.length) setActiveId(list[0].id);
  };

  // Опрос только когда вкладка активна — в фоне запросы не шлём (экономия вычислений).
  const runWhenVisible = (fn: () => void, ms: number) => {
    const tick = () => {
      if (document.visibilityState === 'visible') fn();
    };
    const t = setInterval(tick, ms);
    const onVisible = () => {
      if (document.visibilityState === 'visible') fn();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVisible);
    };
  };

  useEffect(() => {
    loadDialogs();
    return runWhenVisible(loadDialogs, 30000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAssignees = async () => {
    setAssignees(await fetchAssignees());
  };

  useEffect(() => {
    // Список ответственных меняется редко — грузим один раз при открытии.
    loadAssignees();
  }, []);

  useEffect(() => {
    if (activeId === null) return;
    fetchMessages(activeId).then(setMessages);
    return runWhenVisible(() => fetchMessages(activeId).then(setMessages), 15000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (activeId === null) return;
    const d = dialogs.find((x) => x.id === activeId);
    if (!d || d.crmStatus) return;
    setResolving(true);
    resolveCrm(activeId)
      .then(({ crmStatus, crmLabel, childName }) => {
        setDialogs((prev) => prev.map((x) => (x.id === activeId ? { ...x, crmStatus, crmLabel, childName } : x)));
      })
      .finally(() => setResolving(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const isMine = (d: DialogItem) =>
    !!currentUser && d.assignee.trim().toLowerCase() === currentUser.trim().toLowerCase();

  const mineCount = useMemo(() => dialogs.filter(isMine).length, [dialogs, currentUser]);

  // Ключ хранилища «просмотренных назначений» — уникальный для каждого сотрудника.
  const seenKey = `interaction_seen_assigned_${currentUser}`;
  const seededRef = useRef(false);
  const [seenAssigned, setSeenAssigned] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(seenKey) || '[]');
    } catch {
      return [];
    }
  });

  const markSeen = (id: number) => {
    setSeenAssigned((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem(seenKey, JSON.stringify(next));
      notifyInteractionChanged();
      return next;
    });
  };

  const openDialog = (id: number) => {
    markSeen(id);
    setActiveId(id);
  };

  // При первой загрузке считаем все текущие «мои» чаты уже просмотренными,
  // чтобы значок «+N ⭐» показывал только НОВЫЕ передачи ответственности.
  useEffect(() => {
    if (seededRef.current || loading || !currentUser) return;
    if (localStorage.getItem(seenKey) === null) {
      const mineIds = dialogs.filter(isMine).map((d) => d.id);
      localStorage.setItem(seenKey, JSON.stringify(mineIds));
      setSeenAssigned(mineIds);
    }
    seededRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, dialogs, currentUser]);

  const filtered = useMemo(
    () =>
      dialogs.filter(
        (d) =>
          (!onlyMine || isMine(d)) &&
          (d.clientName.toLowerCase().includes(search.toLowerCase()) || d.phone.includes(search)),
      ),
    [dialogs, search, onlyMine, currentUser],
  );

  const send = async () => {
    if (!draft.trim() || !active || sending) return;
    setSending(true);
    const text = draft.trim();
    setDraft('');
    const res = await sendMessage(active.id, text, 'Я');
    if (res.ok) {
      const msgs = await fetchMessages(active.id);
      setMessages(msgs);
    } else {
      setDraft(text);
      toast({ title: res.message || 'Не удалось отправить сообщение в Max', variant: 'destructive' });
    }
    setSending(false);
  };

  const reassign = async (name: string) => {
    if (!active) return;
    setDialogs((prev) => prev.map((d) => (d.id === active.id ? { ...d, assignee: name } : d)));
    await assignDialog(active.id, name);
    notifyInteractionChanged();
  };

  const refreshCrm = () => {
    if (!active) return;
    setResolving(true);
    resolveCrm(active.id, true)
      .then(({ crmStatus, crmLabel, childName }) =>
        setDialogs((prev) => prev.map((x) => (x.id === active.id ? { ...x, crmStatus, crmLabel, childName } : x))),
      )
      .finally(() => setResolving(false));
  };

  const saveContacts = async (contacts: { phone?: string; tgUsername?: string }) => {
    if (!active) return;
    const ok = await setContacts(active.id, contacts);
    if (ok) {
      const uname = (contacts.tgUsername || '').trim().replace(/^@/, '');
      setDialogs((prev) =>
        prev.map((d) =>
          d.id === active.id
            ? {
                ...d,
                phone: contacts.phone?.trim() ? contacts.phone.trim() : d.phone,
                tgUsername: uname ? uname : d.tgUsername,
              }
            : d,
        ),
      );
    } else {
      toast({ title: 'Не удалось сохранить контакты', variant: 'destructive' });
    }
  };

  // Поиск контактов в CRM (с задержкой ввода).
  useEffect(() => {
    if (!newOpen) return;
    const q = crmQuery.trim();
    if (q.length < 2) {
      setCrmResults([]);
      return;
    }
    setCrmSearching(true);
    const t = setTimeout(() => {
      searchCrmContacts(q)
        .then(setCrmResults)
        .finally(() => setCrmSearching(false));
    }, 400);
    return () => clearTimeout(t);
  }, [crmQuery, newOpen]);

  const openNew = () => {
    setCrmQuery('');
    setCrmResults([]);
    setNewOpen(true);
  };

  const startDialog = async (c: CrmContact) => {
    if (creating) return;
    setCreating(true);
    const res = await createDialog({ phone: c.phone, parent: c.parent, child: c.child, status: c.status });
    setCreating(false);
    if (res.ok && res.dialogId) {
      setNewOpen(false);
      await loadDialogs();
      setActiveId(res.dialogId);
    } else {
      toast({ title: res.message || 'Не удалось создать диалог', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-220px)] min-h-[520px]">
      <DialogList
        search={search}
        setSearch={setSearch}
        openNew={openNew}
        onlyMine={onlyMine}
        setOnlyMine={setOnlyMine}
        mineCount={mineCount}
        loading={loading}
        filtered={filtered}
        activeId={activeId}
        setActiveId={openDialog}
        isMine={isMine}
      />

      <ChatPanel
        active={active}
        loading={loading}
        resolving={resolving}
        messages={messages}
        scrollRef={scrollRef}
        draft={draft}
        setDraft={setDraft}
        send={send}
        sending={sending}
      />

      {active && (
        <DialogSidebar
          active={active}
          resolving={resolving}
          refreshCrm={refreshCrm}
          assignees={assignees}
          reassign={reassign}
          currentUser={currentUser}
          saveContacts={saveContacts}
        />
      )}

      {newOpen && (
        <NewDialogModal
          onClose={() => setNewOpen(false)}
          crmQuery={crmQuery}
          setCrmQuery={setCrmQuery}
          crmSearching={crmSearching}
          crmResults={crmResults}
          startDialog={startDialog}
          creating={creating}
        />
      )}
    </div>
  );
};

export default InteractionWindow;