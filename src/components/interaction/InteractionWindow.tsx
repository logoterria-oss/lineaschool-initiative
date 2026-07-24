import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import {
  DialogItem,
  MessageItem,
  CrmStatus,
  fetchDialogs,
  fetchMessages,
  sendMessage,
  assignDialog,
  resolveCrm,
  fetchAssignees,
  searchCrmContacts,
  createDialog,
  CrmContact,
} from '@/lib/interactionsApi';

const CRM_META: Record<CrmStatus, { label: string; short: string; icon: string; cls: string }> = {
  staff: { label: 'Сотрудник', short: 'сотруд.', icon: '', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
  teacher: { label: 'Педагог', short: 'педагог', icon: 'GraduationCap', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
  client: { label: 'Клиент', short: 'клиент', icon: 'UserCheck', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
  lead: { label: 'Лид', short: 'лид', icon: 'UserPlus', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
  parent: { label: 'Родитель', short: 'родитель', icon: 'Users', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
  unknown: { label: 'Не в CRM', short: 'не в CRM', icon: 'UserX', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
};

const CrmBadge = ({ status, small, label, short }: { status: CrmStatus | null; small?: boolean; label?: string | null; short?: boolean }) => {
  if (!status) return null;
  const m = CRM_META[status];
  const text = short ? m.short : (label || m.label);
  return (
    <span className={`inline-flex items-center gap-1 border rounded-full font-medium whitespace-nowrap ${m.cls} ${small ? 'text-[11px] px-1.5 py-0.5' : 'text-sm px-2.5 py-1'}`}>
      {!short && m.icon && <Icon name={m.icon as 'UserCheck'} size={small ? 11 : 14} />}
      {text}
    </span>
  );
};

const CHANNEL_META: Record<string, { label: string; icon: string; color: string }> = {
  max: { label: 'Max', icon: 'MessageCircle', color: 'text-blue-600 bg-blue-50' },
  telegram: { label: 'Telegram', icon: 'Send', color: 'text-sky-600 bg-sky-50' },
  call: { label: 'Звонок', icon: 'Phone', color: 'text-green-600 bg-green-50' },
};

const fmtTime = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

const ChannelBadge = ({ channel, size = 14 }: { channel: string; size?: number }) => {
  const meta = CHANNEL_META[channel] || CHANNEL_META.max;
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${meta.color}`} title={meta.label}>
      <Icon name={meta.icon as 'Send'} size={size} />
    </span>
  );
};

const MessageBubble = ({ msg }: { msg: MessageItem }) => {
  const out = msg.direction === 'out';
  if (msg.isTranscript) {
    return (
      <div className="mx-auto max-w-[85%] my-2">
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-gray-700">
          <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
            <Icon name="Phone" size={14} />
            Расшифровка звонка
            <span className="ml-auto text-xs text-gray-400 font-normal">{fmtTime(msg.time)}</span>
          </div>
          {msg.text}
        </div>
      </div>
    );
  }
  return (
    <div className={`flex ${out ? 'justify-end' : 'justify-start'} my-1.5`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${out ? 'bg-green-500 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
        <div className={`text-xs mb-0.5 flex items-center gap-1.5 ${out ? 'text-green-50' : 'text-gray-400'}`}>
          <Icon name={(CHANNEL_META[msg.channel] || CHANNEL_META.max).icon as 'Send'} size={11} />
          {out ? msg.author || 'Сотрудник' : (CHANNEL_META[msg.channel] || CHANNEL_META.max).label}
        </div>
        <div>{msg.text}</div>
        <div className={`text-[11px] mt-1 text-right ${out ? 'text-green-100' : 'text-gray-400'}`}>{fmtTime(msg.time)}</div>
      </div>
    </div>
  );
};

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
      <div className="w-full lg:w-80 flex-shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по имени или телефону"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:border-green-400"
              />
            </div>
            <button
              onClick={openNew}
              title="Новый диалог из CRM"
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              <Icon name="Plus" size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setOnlyMine(false)}
              className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${!onlyMine ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              Все чаты
            </button>
            <button
              onClick={() => setOnlyMine(true)}
              className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${onlyMine ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              Только мои{mineCount > 0 ? ` · ${mineCount}` : ''}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && <div className="p-4 text-sm text-gray-400 text-center">Загрузка…</div>}
          {!loading && filtered.length === 0 && (
            <div className="p-6 text-sm text-gray-400 text-center">
              {onlyMine
                ? 'На вас пока не назначено ни одного диалога.'
                : 'Пока нет диалогов. Как только клиент напишет в Max, чат появится здесь.'}
            </div>
          )}
          {filtered.map((d) => {
            const isActive = d.id === activeId;
            const bg = isMine(d) ? 'bg-green-50' : 'bg-gray-50';
            const ring = isActive
              ? 'border border-dashed border-green-500'
              : 'border border-transparent border-b-gray-50';
            return (
              <button
                key={d.id}
                onClick={() => setActiveId(d.id)}
                className={`w-full text-left px-3 py-3 transition-colors hover:brightness-95 ${bg} ${ring}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 text-sm truncate min-w-0">{d.clientName}</span>
                  {d.crmStatus && <CrmBadge status={d.crmStatus} small short />}
                  <span className="text-[11px] text-gray-400 ml-auto">{fmtTime(d.lastTime)}</span>
                  {d.unread > 0 && (
                    <span className="bg-green-500 text-white text-[11px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{d.unread}</span>
                  )}
                </div>
                {d.childName && (
                  <div className="text-[11px] text-gray-500 mt-0.5 truncate">Ученик: {d.childName}</div>
                )}
                <div className="flex items-center gap-1.5 mt-1.5">
                  {d.channels.map((c) => <ChannelBadge key={c} channel={c} size={12} />)}
                </div>
                <div className="text-[11px] text-gray-400 mt-1 truncate">{d.assignee}</div>
              </button>
            );
          })}
        </div>
      </div>

      {active ? (
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <Icon name="User" size={18} className="text-green-600" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 truncate">{active.clientName}</div>
              {active.childName && (
                <div className="text-xs text-gray-500 truncate">Ученик: {active.childName}</div>
              )}
              {active.phone && <div className="text-xs text-gray-400">{active.phone}</div>}
            </div>
            <div className="ml-auto flex items-center gap-2">
              {resolving && !active.crmStatus ? (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Icon name="Loader" size={12} className="animate-spin" /> CRM…
                </span>
              ) : (
                <CrmBadge status={active.crmStatus} label={active.crmStatus === 'parent' ? 'Родитель' : active.crmLabel} />
              )}
              {active.channels.map((c) => <ChannelBadge key={c} channel={c} />)}
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 bg-gray-50/50">
            {messages.map((m) => <MessageBubble key={m.id} msg={m} />)}
          </div>

          <div className="border-t border-gray-100 p-3 flex-shrink-0">
            <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-400">
              <ChannelBadge channel="max" size={12} />
              Ответ уйдёт в Max
            </div>
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1}
                placeholder="Напишите сообщение клиенту..."
                className="flex-1 resize-none px-3 py-2.5 text-sm rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-green-400 max-h-32"
              />
              <button
                onClick={send}
                disabled={sending}
                className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <Icon name={sending ? 'Loader' : 'Send'} size={18} className={sending ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center text-gray-400">
          {loading ? 'Загрузка…' : 'Выберите диалог'}
        </div>
      )}

      {active && (
        <div className="w-full lg:w-64 flex-shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">Клиент</div>
            <div className="font-semibold text-gray-900">{active.clientName}</div>
            {active.childName && (
              <div className="text-sm text-gray-500">Ученик: {active.childName}</div>
            )}
            {active.phone && (
              <div className="text-sm text-gray-500">{active.phone}</div>
            )}
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
              Статус в CRM
              <button
                onClick={() => {
                  setResolving(true);
                  resolveCrm(active.id, true)
                    .then(({ crmStatus, crmLabel, childName }) =>
                      setDialogs((prev) => prev.map((x) => (x.id === active.id ? { ...x, crmStatus, crmLabel, childName } : x))),
                    )
                    .finally(() => setResolving(false));
                }}
                title="Обновить из CRM"
                className="text-gray-300 hover:text-green-600"
              >
                <Icon name="RefreshCw" size={12} className={resolving ? 'animate-spin' : ''} />
              </button>
            </div>
            {active.crmStatus ? (
              <CrmBadge status={active.crmStatus} label={active.crmLabel} />
            ) : (
              <span className="text-sm text-gray-400">Определяем…</span>
            )}
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1.5">Ответственный</div>
            <div className="space-y-1">
              {assignees.map((name) => (
                <button
                  key={name}
                  onClick={() => reassign(name)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${active.assignee === name ? 'bg-green-50 text-green-800 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {name}
                </button>
              ))}
              {assignees.length === 0 && (
                <div className="text-sm text-gray-400 px-3 py-2">Загрузка сотрудников…</div>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Передача клиента между сотрудниками — вся история сохраняется.</p>
          </div>
        </div>
      )}

      {newOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20" onClick={() => setNewOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[70vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-lg text-gray-900">Новый диалог</h3>
              <button onClick={() => setNewOpen(false)} className="text-gray-400 hover:text-gray-700">
                <Icon name="X" size={20} />
              </button>
            </div>
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  value={crmQuery}
                  onChange={(e) => setCrmQuery(e.target.value)}
                  placeholder="Поиск: сотрудник, родитель или ребёнок"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:border-green-400"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">Сотрудники школы, клиенты и лиды из CRM</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {crmSearching && <div className="p-4 text-sm text-gray-400 text-center">Ищем…</div>}
              {!crmSearching && crmQuery.trim().length >= 2 && crmResults.length === 0 && (
                <div className="p-6 text-sm text-gray-400 text-center">Никого не нашли</div>
              )}
              {!crmSearching && crmQuery.trim().length < 2 && (
                <div className="p-6 text-sm text-gray-400 text-center">Введите минимум 2 символа</div>
              )}
              {crmResults.map((c) => (
                <button
                  key={c.phone}
                  onClick={() => startDialog(c)}
                  disabled={creating}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 disabled:opacity-60 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Icon name="User" size={18} className="text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 text-sm truncate">{c.parent || c.child || c.phone}</div>
                    {c.child && c.parent && (
                      <div className="text-[11px] text-gray-500 truncate">Ученик: {c.child}</div>
                    )}
                    <div className="text-[11px] text-gray-400">{c.phone}</div>
                  </div>
                  <span className="text-[11px] text-gray-400 flex-shrink-0">{c.statusLabel}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractionWindow;