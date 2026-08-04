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
}

const TYPE_OPTIONS = [
  { value: '', label: 'Все типы' },
  { value: 'primary', label: 'Первичная' },
  { value: 'interim', label: 'Промежуточная' },
];

export default function ReportsFilters({ filters, setFilters, total, visible, therapists }: Props) {
  const hasActive = !!(filters.name || filters.month || filters.type || filters.therapist);

  const reset = () => setFilters({ name: '', month: '', type: '', therapist: '' });

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        <select
          className="h-10 rounded-md border border-input bg-white px-3 text-sm"
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
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