import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { saveElementToPdf } from '@/lib/regulationPdf';
import GroupRegulationIntro from './GroupRegulationIntro';
import GroupRegulationLesson from './GroupRegulationLesson';
import GroupRegulationAfter from './GroupRegulationAfter';

const TOC = [
  { id: 'before', label: '1. До занятия' },
  { id: 'plan', label: '2. Идеальный план занятия' },
  { id: 'lesson', label: '3. Проведение занятия' },
  { id: 'block1', label: '3.1. Упражнения на развитие 1 блока мозга', indent: 1 },
  { id: 'commissural', label: '3.2. Упражнения на развитие комиссуральных связей', indent: 1 },
  { id: 'selfregulation', label: '3.3. Работа над саморегуляцией', indent: 1 },
  { id: 'planning', label: '3.4. Развитие навыка планирования', indent: 1 },
  { id: 'successive', label: '3.5. Развитие сукцессивных процессов', indent: 1 },
  { id: 'control', label: '3.6. Развитие навыка контроля', indent: 1 },
  { id: 'memory', label: '3.7. Развитие рабочей памяти и произвольного внимания', indent: 1 },
  { id: 'after', label: '4. После занятия' },
  { id: 'alfacrm', label: '4.1. Проведение занятия в AlfaCRM', indent: 1 },
];

const GroupRegulation = ({ onBack, hideHeader = false }: { onBack: () => void; hideHeader?: boolean }) => {
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
        'Регламент — групповые занятия.pdf',
        'Регламент педагога: групповые занятия',
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
          <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
            <Icon name="BookOpen" size={22} className="text-purple-600" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
            Групповые занятия
          </h1>
        </div>
      )}

      {/* Сохранить PDF */}
      <div className="mb-6">
        <button
          onClick={savePdf}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Icon name={saving ? 'Loader2' : 'Download'} size={16} className={saving ? 'animate-spin' : ''} />
          {saving ? 'Готовлю PDF…' : 'Сохранить PDF'}
        </button>
      </div>

      {/* Оглавление */}
      <div className="bg-white rounded-2xl border border-gray-200 border-t-4 border-t-purple-500 shadow-sm mb-6 overflow-hidden">
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
                className="w-full text-left text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg py-1.5 text-[14px] transition-colors"
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
        className="bg-white rounded-2xl border border-gray-200 border-t-4 border-t-purple-500 shadow-sm px-5 py-6 md:px-8 md:py-8 space-y-10 text-gray-800 leading-relaxed"
      >
        <GroupRegulationIntro />
        <GroupRegulationLesson />
        <GroupRegulationAfter />
      </div>
    </div>
  );
};

export default GroupRegulation;