import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { MOCK_DIALOGS, CHANNEL_META, Dialog, Message, Channel } from './mockData';

const ASSIGNEES = ['Ирина (РУО)', 'Ольга (админ)', 'Я'];

const ChannelBadge = ({ channel, size = 14 }: { channel: Channel; size?: number }) => {
  const meta = CHANNEL_META[channel];
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${meta.color}`} title={meta.label}>
      <Icon name={meta.icon as 'Send'} size={size} />
    </span>
  );
};

const MessageBubble = ({ msg }: { msg: Message }) => {
  const out = msg.direction === 'out';
  if (msg.isTranscript) {
    return (
      <div className="mx-auto max-w-[85%] my-2">
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-gray-700">
          <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
            <Icon name="Phone" size={14} />
            Расшифровка звонка
            <span className="ml-auto text-xs text-gray-400 font-normal">{msg.time}</span>
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
          <Icon name={CHANNEL_META[msg.channel].icon as 'Send'} size={11} />
          {out ? msg.author || 'Сотрудник' : CHANNEL_META[msg.channel].label}
        </div>
        <div>{msg.text}</div>
        <div className={`text-[11px] mt-1 text-right ${out ? 'text-green-100' : 'text-gray-400'}`}>{msg.time}</div>
      </div>
    </div>
  );
};

const InteractionWindow = () => {
  const [dialogs, setDialogs] = useState<Dialog[]>(MOCK_DIALOGS);
  const [activeId, setActiveId] = useState<string>(MOCK_DIALOGS[0]?.id || '');
  const [draft, setDraft] = useState('');
  const [sendChannel, setSendChannel] = useState<Channel>('telegram');
  const [search, setSearch] = useState('');

  const active = dialogs.find((d) => d.id === activeId) || null;

  const filtered = useMemo(
    () => dialogs.filter((d) => d.clientName.toLowerCase().includes(search.toLowerCase()) || d.phone.includes(search)),
    [dialogs, search],
  );

  const send = () => {
    if (!draft.trim() || !active) return;
    const msg: Message = {
      id: `m${Date.now()}`,
      direction: 'out',
      channel: sendChannel,
      text: draft.trim(),
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      author: 'Я',
    };
    setDialogs((prev) => prev.map((d) => (d.id === active.id ? { ...d, messages: [...d.messages, msg], lastTime: msg.time } : d)));
    setDraft('');
  };

  const reassign = (name: string) => {
    if (!active) return;
    setDialogs((prev) => prev.map((d) => (d.id === active.id ? { ...d, assignee: name } : d)));
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
                  <span className="text-[11px] text-gray-400">{d.lastTime}</span>
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
              <div className="text-xs text-gray-400">{active.phone}</div>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              {active.channels.map((c) => <ChannelBadge key={c} channel={c} />)}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
            {active.messages.map((m) => <MessageBubble key={m.id} msg={m} />)}
          </div>

          <div className="border-t border-gray-100 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs text-gray-400">Отправить через:</span>
              {(['telegram', 'max'] as Channel[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setSendChannel(c)}
                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${sendChannel === c ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <Icon name={CHANNEL_META[c].icon as 'Send'} size={12} />
                  {CHANNEL_META[c].label}
                </button>
              ))}
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
              <button onClick={send} className="bg-green-500 hover:bg-green-600 text-white rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0 transition-colors">
                <Icon name="Send" size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center text-gray-400">
          Выберите диалог
        </div>
      )}

      {active && (
        <div className="w-full lg:w-64 flex-shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">Клиент</div>
            <div className="font-semibold text-gray-900">{active.clientName}</div>
            <div className="text-sm text-gray-500">{active.phone}</div>
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
