import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import {
  DialogItem,
  MessageItem,
  fetchDialogs,
  fetchMessages,
  sendMessage,
  assignDialog,
} from '@/lib/interactionsApi';

const ASSIGNEES = ['Ирина (РУО)', 'Ольга (админ)', 'Я'];

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
  const [dialogs, setDialogs] = useState<DialogItem[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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

  useEffect(() => {
    loadDialogs();
    const t = setInterval(loadDialogs, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeId === null) return;
    fetchMessages(activeId).then(setMessages);
    const t = setInterval(() => fetchMessages(activeId).then(setMessages), 8000);
    return () => clearInterval(t);
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const filtered = useMemo(
    () => dialogs.filter((d) => d.clientName.toLowerCase().includes(search.toLowerCase()) || d.phone.includes(search)),
    [dialogs, search],
  );

  const send = async () => {
    if (!draft.trim() || !active || sending) return;
    setSending(true);
    const text = draft.trim();
    setDraft('');
    const ok = await sendMessage(active.id, text, 'Я');
    if (ok) {
      const msgs = await fetchMessages(active.id);
      setMessages(msgs);
    } else {
      setDraft(text);
    }
    setSending(false);
  };

  const reassign = async (name: string) => {
    if (!active) return;
    setDialogs((prev) => prev.map((d) => (d.id === active.id ? { ...d, assignee: name } : d)));
    await assignDialog(active.id, name);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-220px)] min-h-[520px]">
      <div className="w-full lg:w-80 flex-shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени или телефону"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:border-green-400"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && <div className="p-4 text-sm text-gray-400 text-center">Загрузка…</div>}
          {!loading && filtered.length === 0 && (
            <div className="p-6 text-sm text-gray-400 text-center">
              Пока нет диалогов. Как только клиент напишет в Max, чат появится здесь.
            </div>
          )}
          {filtered.map((d) => {
            const isActive = d.id === activeId;
            return (
              <button
                key={d.id}
                onClick={() => setActiveId(d.id)}
                className={`w-full text-left px-3 py-3 border-b border-gray-50 transition-colors ${isActive ? 'bg-green-50' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 text-sm truncate flex-1">{d.clientName}</span>
                  <span className="text-[11px] text-gray-400">{fmtTime(d.lastTime)}</span>
                  {d.unread > 0 && (
                    <span className="bg-green-500 text-white text-[11px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{d.unread}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {d.channels.map((c) => <ChannelBadge key={c} channel={c} size={12} />)}
                  <span className={`ml-1 text-[11px] px-1.5 py-0.5 rounded-full ${d.status === 'lead' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {d.status === 'lead' ? 'Лид' : 'Клиент'}
                  </span>
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
              <div className="text-xs text-gray-400">{active.phone || active.chatId}</div>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              {active.channels.map((c) => <ChannelBadge key={c} channel={c} />)}
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
            {messages.map((m) => <MessageBubble key={m.id} msg={m} />)}
          </div>

          <div className="border-t border-gray-100 p-3">
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
            <div className="text-sm text-gray-500">{active.phone || active.chatId}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Статус</div>
            <span className={`text-sm px-2 py-0.5 rounded-full ${active.status === 'lead' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {active.status === 'lead' ? 'Лид' : 'Клиент'}
            </span>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1.5">Ответственный</div>
            <div className="space-y-1">
              {ASSIGNEES.map((name) => (
                <button
                  key={name}
                  onClick={() => reassign(name)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${active.assignee === name ? 'bg-green-50 text-green-800 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {name}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Передача клиента между РУО и админом — вся история сохраняется.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractionWindow;
