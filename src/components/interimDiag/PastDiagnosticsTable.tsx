import Icon from '@/components/ui/icon';
import { PastEntry } from './pastDiagnostics';

interface Props {
  items: PastEntry[];
  editingId: number | null;
  onEdit: (it: PastEntry) => void;
  onRemove: (id: number) => void;
}

function fmt(d: string | null) {
  if (!d) return '—';
  const p = d.split('-');
  return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : d;
}

export default function PastDiagnosticsTable({ items, editingId, onEdit, onRemove }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-gray-500">
            <th className="pb-2 pr-3">Тип</th>
            <th className="pb-2 pr-3">Дата</th>
            <th className="pb-2 pr-3">Скорость</th>
            <th className="pb-2 pr-3">Понимание</th>
            <th className="pb-2 pr-3">Дисграф.</th>
            <th className="pb-2 pr-3">Орфогр.</th>
            <th className="pb-2 pr-3">Всего</th>
            <th className="pb-2 pr-3">Нарушено</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr
              key={it.id}
              className={`border-t border-gray-100 ${editingId === it.id ? 'bg-primary/5' : ''}`}
            >
              <td className="py-2 pr-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    it.diagType === 'primary'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {it.diagType === 'primary' ? 'Первичная' : 'Промежуточная'}
                </span>
              </td>
              <td className="py-2 pr-3 font-medium text-gray-900">{fmt(it.date)}</td>
              <td className="py-2 pr-3">{it.readingSpeed || '—'}</td>
              <td className="py-2 pr-3">{it.readingComprehension || '—'}</td>
              <td className="py-2 pr-3">{it.dysgraphicErrors || '—'}</td>
              <td className="py-2 pr-3">{it.dysorthographicErrors || '—'}</td>
              <td className="py-2 pr-3">{it.totalErrors || '—'}</td>
              <td className="py-2 pr-3 text-gray-600">
                {Object.values(it.levels || {}).filter((v) => v && v !== 'норма').length || '—'}
              </td>
              <td className="py-2 text-right whitespace-nowrap">
                <a
                  href={it.diagType === 'primary' ? `/diag/${it.id}` : `/interim_diag/${it.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mr-2 inline-block align-middle text-gray-400 hover:text-primary"
                  title="Открыть заключение"
                >
                  <Icon name="FileText" size={16} />
                </a>
                <button
                  type="button"
                  onClick={() => onEdit(it)}
                  className="mr-2 text-gray-400 hover:text-primary"
                  title="Изменить"
                >
                  <Icon name="Pencil" size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(it.id)}
                  className="text-gray-400 hover:text-red-600"
                  title="Удалить"
                >
                  <Icon name="Trash2" size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}