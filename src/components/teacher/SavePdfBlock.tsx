import { ReactNode, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { saveElementToPdf } from '@/lib/regulationPdf';

/**
 * Обёртка с кнопкой «Сохранить PDF» над содержимым.
 * Используется для «Критериев оценки» и «KPI» — сохраняет в PDF ровно то,
 * что видно на экране.
 */
const SavePdfBlock = ({
  title,
  fileName,
  children,
}: {
  title: string;
  fileName: string;
  children: ReactNode;
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const savePdf = async () => {
    if (!contentRef.current || saving) return;
    setSaving(true);
    try {
      await saveElementToPdf(contentRef.current, fileName, title);
    } catch (e) {
      console.error('PDF error:', e);
      alert('Не удалось сохранить PDF. Попробуйте ещё раз.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <button
          onClick={savePdf}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Icon name={saving ? 'Loader2' : 'Download'} size={16} className={saving ? 'animate-spin' : ''} />
          {saving ? 'Готовлю PDF…' : 'Сохранить PDF'}
        </button>
      </div>

      <div ref={contentRef}>{children}</div>
    </div>
  );
};

export default SavePdfBlock;
