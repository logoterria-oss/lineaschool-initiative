import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";

const CITY_SEARCH_URL = 'https://functions.poehali.dev/41101c3b-0b75-4f91-81c7-e6d4031e76fd';

interface CityResult {
  name: string;
  label: string;
  timezone: number | null;
  timezone_label: string;
  region: string;
}

interface CitySelectProps {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  id?: string;
}

export default function CitySelect({ value, onChange, placeholder = "Начните вводить населённый пункт...", id }: CitySelectProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<CityResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${CITY_SEARCH_URL}?q=${encodeURIComponent(q)}`);
      const data: CityResult[] = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    if (!val) {
      onChange('');
      setSelectedTimezone('');
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const handleSelect = (item: CityResult) => {
    onChange(item.name);
    setQuery(item.label);
    setSelectedTimezone(item.timezone_label);
    setOpen(false);
    setResults([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={query}
        onChange={handleChange}
        onFocus={() => query.length >= 2 && results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {selectedTimezone && (
        <span className="text-xs text-gray-400 mt-1 block">
          Часовой пояс: {selectedTimezone}
        </span>
      )}
      {loading && (
        <span className="text-xs text-gray-400 mt-1 block">Поиск...</span>
      )}
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.map((item) => (
            <button
              key={item.label}
              type="button"
              onMouseDown={() => handleSelect(item)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between gap-2"
            >
              <span className="truncate">{item.label}</span>
              {item.timezone_label && (
                <span className="text-xs text-gray-400 flex-shrink-0">{item.timezone_label}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
