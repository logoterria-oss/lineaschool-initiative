import Icon from '@/components/ui/icon';
import { formatSavedAt } from '@/hooks/useFormDraft';

/** Ненавязчивая отметка, что черновик сохранён в браузере */
export default function DraftStatus({ savedAt }: { savedAt: string | null }) {
  if (!savedAt) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
      <Icon name="Check" size={14} className="text-green-600" />
      Черновик сохранён {formatSavedAt(savedAt)}
    </span>
  );
}
