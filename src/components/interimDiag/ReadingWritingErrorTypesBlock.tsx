import { useState } from 'react';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';
import { DysgraphicErrorItem } from './readingWriting';

export interface ErrorTypesBlockProps {
  items: DysgraphicErrorItem[];
  onToggleStruck: (idx: number) => void;
  onRemoveAdded: (idx: number) => void;
  onAdd: (label: string) => void;
  title: string;
  addLabel: string;
  catalog: { group: string; items: string[] }[];
}

export default function ErrorTypesBlock({
  items,
  onToggleStruck,
  onRemoveAdded,
  onAdd,
  title,
  addLabel,
  catalog,
}: ErrorTypesBlockProps) {
  const [open, setOpen] = useState(false);
  const chosen = new Set(items.map((it) => it.label.toLowerCase()));

  return (
    <div>
      <Label className="text-sm text-gray-700">{title}</Label>
      <p className="text-xs text-gray-400 mt-1">
        Вычеркните ошибки, которых больше нет, и добавьте новые типы.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((it, idx) => (
          <div
            key={`${it.label}-${idx}`}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${
              it.added
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-gray-200 bg-gray-50 text-gray-800'
            } ${it.struck ? 'opacity-60' : ''}`}
          >
            <span className={it.struck ? 'line-through' : ''}>
              {it.added ? '+' : ''}
              {it.label}
            </span>
            {it.added ? (
              <button
                type="button"
                onClick={() => onRemoveAdded(idx)}
                title="Удалить"
                className="text-red-500 hover:text-red-700"
              >
                <Icon name="X" size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onToggleStruck(idx)}
                title={it.struck ? 'Вернуть' : 'Вычеркнуть'}
                className="text-gray-400 hover:text-gray-600"
              >
                <Icon name={it.struck ? 'RotateCcw' : 'Strikethrough'} size={14} />
              </button>
            )}
          </div>
        ))}

        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-white px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Icon name="Plus" size={14} />
              {addLabel}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto w-80">
            {catalog.map((group) => (
              <div key={group.group}>
                <DropdownMenuLabel className="text-xs text-gray-500">
                  {group.group}
                </DropdownMenuLabel>
                {group.items.map((label) => {
                  const already = chosen.has(label.toLowerCase());
                  return (
                    <DropdownMenuItem
                      key={label}
                      disabled={already}
                      onSelect={() => onAdd(label)}
                      className="text-sm"
                    >
                      {label}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
