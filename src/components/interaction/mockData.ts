export type Channel = 'max' | 'telegram' | 'call';
export type MessageDirection = 'in' | 'out';
export type AssigneeRole = 'head' | 'admin' | 'me';

export interface Message {
  id: string;
  direction: MessageDirection;
  channel: Channel;
  text: string;
  time: string;
  /** для звонков — расшифровка */
  isTranscript?: boolean;
  /** имя сотрудника-отправителя для исходящих */
  author?: string;
}

export interface Dialog {
  id: string;
  clientName: string;
  phone: string;
  channels: Channel[];
  assignee: string;
  assigneeRole: AssigneeRole;
  unread: number;
  lastTime: string;
  status: 'lead' | 'client';
  messages: Message[];
}

export const CHANNEL_META: Record<Channel, { label: string; icon: string; color: string }> = {
  max: { label: 'Max', icon: 'MessageCircle', color: 'text-blue-600 bg-blue-50' },
  telegram: { label: 'Telegram', icon: 'Send', color: 'text-sky-600 bg-sky-50' },
  call: { label: 'Звонок', icon: 'Phone', color: 'text-green-600 bg-green-50' },
};

export const MOCK_DIALOGS: Dialog[] = [
  {
    id: 'd1',
    clientName: 'Анна Смирнова',
    phone: '+7 916 123-45-67',
    channels: ['telegram', 'call'],
    assignee: 'Ольга (админ)',
    assigneeRole: 'admin',
    unread: 2,
    lastTime: '14:32',
    status: 'lead',
    messages: [
      { id: 'm1', direction: 'in', channel: 'telegram', text: 'Здравствуйте! Подскажите, есть ли места в группе для второклассника?', time: '14:20' },
      { id: 'm2', direction: 'out', channel: 'telegram', text: 'Добрый день! Да, есть свободные слоты по вторникам и четвергам. Хотите записаться на пробное?', time: '14:24', author: 'Ольга' },
      { id: 'm3', direction: 'in', channel: 'call', isTranscript: true, text: 'Расшифровка звонка (3:12): клиент уточнил стоимость абонемента и график. Договорились о пробном занятии во вторник в 16:00.', time: '14:30' },
      { id: 'm4', direction: 'in', channel: 'telegram', text: 'Отлично, тогда запишите нас на вторник!', time: '14:32' },
    ],
  },
  {
    id: 'd2',
    clientName: 'Дмитрий Ковалёв',
    phone: '+7 925 987-65-43',
    channels: ['max'],
    assignee: 'Ирина (РУО)',
    assigneeRole: 'head',
    unread: 0,
    lastTime: '12:05',
    status: 'client',
    messages: [
      { id: 'm1', direction: 'in', channel: 'max', text: 'Добрый день, когда ближайшая оплата?', time: '11:58' },
      { id: 'm2', direction: 'out', channel: 'max', text: 'Здравствуйте! Оплата до 25 числа, ссылку отправлю сегодня.', time: '12:05', author: 'Ирина' },
    ],
  },
  {
    id: 'd3',
    clientName: 'Елена Петрова',
    phone: '+7 903 222-11-00',
    channels: ['telegram', 'max', 'call'],
    assignee: 'Не назначен',
    assigneeRole: 'me',
    unread: 5,
    lastTime: 'вчера',
    status: 'lead',
    messages: [
      { id: 'm1', direction: 'in', channel: 'max', text: 'Интересует индивидуальное занятие', time: 'вчера' },
      { id: 'm2', direction: 'in', channel: 'call', isTranscript: true, text: 'Расшифровка звонка (1:45): клиент спрашивал про онлайн-формат, оставил заявку на консультацию.', time: 'вчера' },
    ],
  },
];
