import Icon from '@/components/ui/icon';
import { MessageItem, CrmStatus } from '@/lib/interactionsApi';

// Ключ сотрудника: «Фамилия Имя» в нижнем регистре, без отчества и без роли в скобках.
// Нужно, потому что имя из профиля — «Фамилия Имя Отчество»,
// а ответственный хранится как «Фамилия Имя (роль)».
export const staffKey = (name: string) =>
  (name || '')
    .replace(/\(.*?\)/g, '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ');

// Совпадают ли два имени сотрудника (по «Фамилия Имя»).
export const sameStaff = (a: string, b: string) => {
  const ka = staffKey(a);
  const kb = staffKey(b);
  return !!ka && ka === kb;
};

// Короткое имя сотрудника для подписи сообщения: «Фамилия Имя»,
// без отчества и без роли в скобках, с сохранением регистра.
export const shortStaffName = (name: string) =>
  (name || '')
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ') || 'Сотрудник';

export const CRM_META: Record<CrmStatus, { label: string; short: string; icon: string; cls: string }> = {
  staff: { label: 'Сотрудник', short: 'сотруд.', icon: '', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
  teacher: { label: 'Педагог', short: 'педагог', icon: 'GraduationCap', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
  client: { label: 'Клиент', short: 'клиент', icon: 'UserCheck', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
  lead: { label: 'Лид', short: 'лид', icon: 'UserPlus', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
  parent: { label: 'Родитель', short: 'родитель', icon: 'Users', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
  unknown: { label: 'Не в CRM', short: 'не в CRM', icon: 'UserX', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
};

export const CrmBadge = ({ status, small, label, short }: { status: CrmStatus | null; small?: boolean; label?: string | null; short?: boolean }) => {
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

export const CHANNEL_META: Record<string, { label: string; icon: string; color: string }> = {
  max: { label: 'Max', icon: 'MessageCircle', color: 'text-blue-600 bg-blue-50' },
  telegram: { label: 'Telegram', icon: 'Send', color: 'text-sky-600 bg-sky-50' },
  call: { label: 'Звонок', icon: 'Phone', color: 'text-green-600 bg-green-50' },
};

export const fmtTime = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

export const ChannelBadge = ({ channel, size = 14 }: { channel: string; size?: number }) => {
  const meta = CHANNEL_META[channel] || CHANNEL_META.max;
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${meta.color}`} title={meta.label}>
      <Icon name={meta.icon as 'Send'} size={size} />
    </span>
  );
};

export const MessageBubble = ({ msg }: { msg: MessageItem }) => {
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
          {out ? shortStaffName(msg.author || '') : (CHANNEL_META[msg.channel] || CHANNEL_META.max).label}
        </div>
        <div>{msg.text}</div>
        <div className={`text-[11px] mt-1 text-right ${out ? 'text-green-100' : 'text-gray-400'}`}>{fmtTime(msg.time)}</div>
      </div>
    </div>
  );
};