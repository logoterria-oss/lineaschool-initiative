import { useState } from 'react';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface Props {
  title: string;
  catalog: { group: string; items: string[] }[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export default function PastDiagnosticsErrorList({
  title,
  catalog,
  selected,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');

  const has = (label: string) => selected.some((x) => x.toLowerCase() === label.toLowerCase());

  const toggle = (label: string) => {
    if (has(label)) {
      onChange(selected.filter((x) => x.toLowerCase() !== label.toLowerCase()));
    } else {
      onChange([...selected, label]);
    }
  };

  const addCustom = () => {
    const label = custom.trim();
    if (!label || has(label)) {
      setCustom('');
      return;
    }
    onChange([...selected, label]);
    setCustom('');
  };

  return (
    <div className="rounded-md border border-gray-200 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-800">
          {title}
          <span className="ml-2 text-xs font-normal text-gray-500">
            выбрано: {selected.length}
          </span>
        </p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 text-sm text-primary hover:opacity-80"
        >
          <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={16} />
          {open ? 'Свернуть' : 'Выбрать'}
        </button>
      </div>

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
            >
              {label}
              <button
                type="button"
                onClick={() => toggle(label)}
                className="text-gray-400 hover:text-red-600"
                title="Убрать"
              >
                <Icon name="X" size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
          {catalog.map((group) => (
            <div key={group.group}>
              <p className="mb-1.5 text-xs font-semibold uppercase text-gray-500">{group.group}</p>
              <div className="space-y-1.5">
                {group.items.map((label) => (
                  <label
                    key={label}
                    className="flex cursor-pointer items-start gap-2 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={has(label)}
                      onChange={() => toggle(label)}
                      className="mt-0.5"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-2 pt-1">
            <Input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Своя формулировка"
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustom();
                }
              }}
            />
            <button
              type="button"
              onClick={addCustom}
              className="whitespace-nowrap rounded-lg border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50"
            >
              Добавить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
