import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { TOC } from './individualRegulationData';
import IndividualRegulationContentPart1 from './IndividualRegulationContentPart1';
import IndividualRegulationContentPart2 from './IndividualRegulationContentPart2';
import { saveElementToPdf } from '@/lib/regulationPdf';

const IndividualRegulation = ({ onBack, hideHeader = false }: { onBack: () => void; hideHeader?: boolean }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const savePdf = async () => {
    if (!contentRef.current || saving) return;
    setSaving(true);
    try {
      await saveElementToPdf(
        contentRef.current,
        'Регламент — индивидуальные занятия.pdf',
        'Регламент педагога: индивидуальные занятия',
      );
    } catch (e) {
      console.error('PDF error:', e);
      alert('Не удалось сохранить PDF. Попробуйте ещё раз.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Шапка */}
      {!hideHeader && (
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
          >
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <Icon name="BookOpen" size={22} className="text-blue-600" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
            Индивидуальные занятия
          </h1>
        </div>
      )}

      {/* Сохранить PDF */}
      <div className="mb-6">
        <button
          onClick={savePdf}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Icon name={saving ? 'Loader2' : 'Download'} size={16} className={saving ? 'animate-spin' : ''} />
          {saving ? 'Готовлю PDF…' : 'Сохранить PDF'}
        </button>
      </div>

      {/* Оглавление */}
      <div className="bg-white rounded-2xl border border-gray-200 border-t-4 border-t-blue-500 shadow-sm mb-6 overflow-hidden">
        <button
          onClick={() => setTocOpen(!tocOpen)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
        >
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Оглавление</span>
          <Icon name={tocOpen ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-gray-400" />
        </button>
        {tocOpen && (
          <nav className="space-y-0.5 px-5 pb-4">
            {TOC.map((item) => (
              <button
                key={item.id}
                onClick={() => { scrollTo(item.id); setTocOpen(false); }}
                className="w-full text-left text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg py-1.5 text-[14px] transition-colors"
                style={{ paddingLeft: `${(item.indent ?? 0) * 14 + 12}px` }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Контент */}
      <div
        ref={contentRef}
        className="bg-white rounded-2xl border border-gray-200 border-t-4 border-t-blue-500 shadow-sm px-5 py-6 md:px-8 md:py-8 space-y-10 text-gray-800 leading-relaxed"
      >
        <IndividualRegulationContentPart1 />
        <IndividualRegulationContentPart2 />
      </div>
    </div>
  );
};

export default IndividualRegulation;