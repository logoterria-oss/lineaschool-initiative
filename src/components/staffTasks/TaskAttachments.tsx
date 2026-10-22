import Icon from '@/components/ui/icon';
import { TaskFile } from '@/lib/staffTasksApi';

interface Props {
  files: TaskFile[];
  onRemove?: (index: number) => void;
}

const isImage = (f: TaskFile) => f.type.startsWith('image/');

const fmtSize = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} МБ` : `${Math.max(1, Math.round(n / 1024))} КБ`);

const TaskAttachments = ({ files, onRemove }: Props) => {
  if (!files.length) return null;
  const images = files.map((f, i) => ({ f, i })).filter(({ f }) => isImage(f));
  const docs = files.map((f, i) => ({ f, i })).filter(({ f }) => !isImage(f));

  const removeBtn = (i: number) =>
    onRemove && (
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); onRemove(i); }}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center"
        title="Убрать"
      >
        <Icon name="X" size={12} />
      </button>
    );

  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map(({ f, i }) => (
            <div key={f.url} className="relative">
              <a href={f.url} target="_blank" rel="noopener noreferrer" title={f.name}>
                <img src={f.url} alt={f.name} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
              </a>
              {removeBtn(i)}
            </div>
          ))}
        </div>
      )}
      {docs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {docs.map(({ f, i }) => (
            <div key={f.url} className="relative">
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 max-w-[260px]"
              >
                <Icon name="FileText" size={16} className="text-purple-600 flex-shrink-0" />
                <span className="truncate text-gray-800">{f.name}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">{fmtSize(f.size)}</span>
              </a>
              {removeBtn(i)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskAttachments;
