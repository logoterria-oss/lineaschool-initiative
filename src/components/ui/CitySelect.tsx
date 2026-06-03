import { useState, useRef, useEffect } from "react";
import { RUSSIAN_CITIES, getTimezoneLabel } from "@/data/russianCities";
import { Input } from "@/components/ui/input";

interface CitySelectProps {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  id?: string;
}

export default function CitySelect({ value, onChange, placeholder = "Начните вводить город...", id }: CitySelectProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.length >= 1
    ? RUSSIAN_CITIES.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 50)
    : [];

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedCity = RUSSIAN_CITIES.find(c => c.name === value);

  const handleSelect = (cityName: string) => {
    onChange(cityName);
    setQuery(cityName);
    setOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setOpen(true);
    if (!e.target.value) onChange("");
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={query}
        onChange={handleChange}
        onFocus={() => query.length >= 1 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {selectedCity && (
        <span className="text-xs text-gray-400 mt-1 block">
          Часовой пояс: {getTimezoneLabel(selectedCity.timezone)}
        </span>
      )}
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {filtered.map(city => (
            <button
              key={city.name}
              type="button"
              onMouseDown={() => handleSelect(city.name)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
            >
              <span>{city.name}</span>
              <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{getTimezoneLabel(city.timezone)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
