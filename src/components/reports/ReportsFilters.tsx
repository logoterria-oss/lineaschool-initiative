import React from 'react';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

export interface ReportsFilterState {
  name: string;
  month: string;
  type: string;
  therapist: string;
}

interface Props {
  filters: ReportsFilterState;
  setFilters: (f: ReportsFilterState) => void;
  total: number;
  visible: number;
  therapists: string[];
  // Счётчики по типам для вкладок (необязательны)
  primaryCount?: number;
  interimCount?: number;
}

const TYPE_TABS = [
  { value: '', label: 'Все' },
  { value: 'primary', label: 'Первичные' },
  { value: 'interim', label: 'Промежуточные' },
];

export default function ReportsFilters({
  filters,
  setFilters,
  total,
  visible,
  therapists,
  primaryCount,
  interimCount,
}: Props) {
  const countFor = (value: string) => {
    if (value === 'primary') return primaryCount;
    if (value === 'interim') return interimCount;
    return total;
  };
  const hasActive = !!(filters.name || filters.month || filters.type || filters.therapist);

  const reset = () => setFilters({ name: '', month: '', type: '', therapist: '' });

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Поиск по имени ребёнка"
            className="pl-9 bg-white"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />
        </div>
        <Input
          type="month"
          className="bg-white"
          value={filters.month}
          onChange={(e) => setFilters({ ...filters, month: e.target.value })}
        />
        <select
          className="h-10 rounded-md border border-input bg-white px-3 text-sm"
          value={filters.therapist}
          onChange={(e) => setFilters({ ...filters, therapist: e.target.value })}
        >
          <option value="">Все диагносты</option>
          {therapists.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {TYPE_TABS.map((tab) => {
          const active = filters.type === tab.value;
          const count = countFor(tab.value);
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilters({ ...filters, type: tab.value })}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              {typeof count === 'number' && (
                <span className={active ? 'ml-1.5 opacity-80' : 'ml-1.5 text-gray-400'}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {hasActive && (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <Icon name="Filter" size={14} className="text-amber-500" />
          <span>Показано: <b className="text-gray-700">{visible}</b> из {total}</span>
          <button onClick={reset} className="text-amber-600 hover:underline">Сбросить</button>
        </div>
      )}
    </div>
  );
}