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
}: {
  filter: StatusFilter;
  setFilter: (f: StatusFilter) => void;
  tariffFilter: string[];
  setTariffFilter: (v: string[]) => void;
  toggleTariff: (name: string) => void;
  tariffOptions: string[];
  search: string;
  setSearch: (v: string) => void;
}) => (
  <div className="flex flex-wrap items-center gap-2">
    {/* Статус */}
    <select
      value={filter}
      onChange={(e) => setFilter(e.target.value as StatusFilter)}
      className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
    >
      {STATUS_FILTERS.map((f) => (
        <option key={f.id} value={f.id}>
          {f.label}
        </option>
      ))}
    </select>

    {/* Абонемент (мультиселект) */}
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
