import Icon from '@/components/ui/icon';

export type Tab = 'main' | 'progress' | 'vacations' | 'interactions';

export const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'main', label: 'Основное', icon: 'User' },
  { id: 'interactions', label: 'Взаимодействия', icon: 'MessagesSquare' },
  { id: 'vacations', label: 'Даты каникул', icon: 'CalendarOff' },
  { id: 'progress', label: 'Мониторинг прогресса', icon: 'TrendingUp' },
];

export const fmtDate = (d: string | null) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y}`;
};

export const statusBadge = (statusId: number | null) => {
  if (statusId === 1) return 'bg-green-100 text-green-700';
  if (statusId === 5) return 'bg-amber-100 text-amber-700';
  if (statusId === 4) return 'bg-blue-100 text-blue-700';
  if (statusId === 3) return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
};

// Цвет точки статуса: зелёная-активен, жёлтая-каникулы, голубая-каникулы(заморожен),
// красная-бросил/завершил.
export const statusDot = (statusId: number | null) => {
  if (statusId === 1) return 'bg-green-500';
  if (statusId === 5) return 'bg-amber-400';
  if (statusId === 4) return 'bg-sky-400';
  if (statusId === 3 || statusId === 2) return 'bg-red-500';
  return 'bg-gray-300';
};

export const ageLabel = (age: number | null) => {
  if (!age) return '';
  const n = age % 100;
  const n1 = age % 10;
  if (n > 10 && n < 20) return `${age} лет`;
  if (n1 === 1) return `${age} год`;
  if (n1 >= 2 && n1 <= 4) return `${age} года`;
  return `${age} лет`;
};

// Точка-статус ведёт себя как последняя буква имени: приклеена к последнему слову,
// поэтому не отрывается и не съезжает при переносе ФИ на несколько строк.
export const NameWithDot = ({
  name,
  statusId,
  statusName,
}: {
  name: string;
  statusId: number | null;
  statusName: string;
}) => {
  const parts = (name || '').trim().split(' ');
  const last = parts.pop() || '';
  const head = parts.join(' ');
  return (
    <span className="leading-snug">
      {head && `${head} `}
      <span className="whitespace-nowrap">
        {last}
        <span
          title={statusName}
          className={`inline-block ml-1 w-2 h-2 rounded-full ${statusDot(statusId)}`}
        />
      </span>
    </span>
  );
};

// Бокс с подсказками, как работать с разделом.
export const HintBox = ({ title, hints }: { title: string; hints: string[] }) => (
  <div className="mb-4 rounded-xl border border-purple-100 bg-purple-50/60 p-4">
    <div className="flex items-center gap-2 mb-2">
      <Icon name="Lightbulb" size={16} className="text-purple-600" />
      <span className="text-sm font-semibold text-purple-800">{title}</span>
    </div>
    <ul className="space-y-1">
      {hints.map((h, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
          <Icon name="Check" size={14} className="text-purple-500 mt-0.5 flex-shrink-0" />
          <span>{h}</span>
        </li>
      ))}
    </ul>
  </div>
);

export const Placeholder = ({ icon, title }: { icon: string; title: string }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
    <div className="inline-flex p-4 rounded-full bg-purple-100 mb-4">
      <Icon name={icon} size={32} className="text-purple-600" />
    </div>
    <p className="text-lg font-medium text-gray-500">Раздел «{title}» в разработке</p>
  </div>
);