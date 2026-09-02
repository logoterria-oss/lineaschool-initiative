import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { StatusFilter, STATUS_FILTERS } from '@/lib/studentsApi';

const StudentsFilters = ({
  filter,
  setFilter,
  tariffFilter,
  setTariffFilter,
  toggleTariff,
  tariffOptions,
  search,
  setSearch,
  compact = false,
}: {
  filter: StatusFilter[];
  setFilter: (f: StatusFilter[]) => void;
  tariffFilter: string[];
  setTariffFilter: (v: string[]) => void;
  toggleTariff: (name: string) => void;
  tariffOptions: string[];
  search: string;
  setSearch: (v: string) => void;
  compact?: boolean;
}) => (
  <div className="flex flex-wrap items-center gap-2">
    {/* Статус (мультиселект): можно смотреть, например, активных
        и «каникуляров — пора связаться» одновременно. */}
    {!compact && (
      <Popover>
        <PopoverTrigger asChild>
          <button className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm text-gray-700 inline-flex items-center gap-1.5 hover:border-purple-300">
            <Icon name="Users" size={15} className="text-gray-400" />
            {filter.length === 1
              ? (STATUS_FILTERS.find((f) => f.id === filter[0])?.label ?? 'Статус')
              : 'Статус'}
            {filter.length > 1 && (
              <span className="ml-0.5 text-xs bg-purple-600 text-white rounded-full px-1.5">
                {filter.length}
              </span>
            )}
            <Icon name="ChevronDown" size={14} className="text-gray-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-2">
          {filter.length > 0 && (
            <button
              onClick={() => setFilter([])}
              className="w-full text-left text-xs text-purple-600 hover:underline px-2 py-1 mb-1"
            >
              Сбросить выбор
            </button>
          )}
          {STATUS_FILTERS.map((f) => (
            <label
              key={f.id}
              className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
            >
              <Checkbox
                checked={filter.includes(f.id)}
                onCheckedChange={() =>
                  setFilter(
                    filter.includes(f.id)
                      ? filter.filter((x) => x !== f.id)
                      : [...filter, f.id],
                  )
                }
                className="mt-0.5"
              />
              <span className="text-sm text-gray-700 leading-snug">{f.label}</span>
            </label>
          ))}
        </PopoverContent>
      </Popover>
    )}

    {/* Абонемент (мультиселект) */}
    {!compact && (
    <Popover>
      <PopoverTrigger asChild>
        <button className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm text-gray-700 inline-flex items-center gap-1.5 hover:border-purple-300">
          <Icon name="Ticket" size={15} className="text-gray-400" />
          Абонемент
          {tariffFilter.length > 0 && (
            <span className="ml-0.5 text-xs bg-purple-600 text-white rounded-full px-1.5">
              {tariffFilter.length}
            </span>
          )}
          <Icon name="ChevronDown" size={14} className="text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2 max-h-80 overflow-y-auto">
        {tariffFilter.length > 0 && (
          <button
            onClick={() => setTariffFilter([])}
            className="w-full text-left text-xs text-purple-600 hover:underline px-2 py-1 mb-1"
          >
            Сбросить выбор
          </button>
        )}
        {tariffOptions.length === 0 ? (
          <p className="text-sm text-gray-400 px-2 py-1">Нет данных</p>
        ) : (
          tariffOptions.map((name) => (
            <label
              key={name}
              className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
            >
              <Checkbox
                checked={tariffFilter.includes(name)}
                onCheckedChange={() => toggleTariff(name)}
                className="mt-0.5"
              />
              <span className="text-sm text-gray-700 leading-snug">{name}</span>
            </label>
          ))
        )}
      </PopoverContent>
    </Popover>
    )}

    {/* Поиск */}
    <Input
      placeholder="Поиск по ФИО"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="h-9 w-44"
    />
  </div>
);

export default StudentsFilters;