import Icon from '@/components/ui/icon';

interface Props {
  onBack: () => void;
  onDownloadPdf: () => void;
  /** Пока факт не загружен, скачивать нечего. */
  pdfDisabled: boolean;
  pdfLoading: boolean;
}

/** Шапка отчёта: возврат назад, пояснение и выгрузка PDF. */
export default function UnitReportHeader({
  onBack, onDownloadPdf, pdfDisabled, pdfLoading,
}: Props) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <button
        onClick={onBack}
        className="text-gray-400 hover:text-gray-700 transition-colors mt-1"
      >
        <Icon name="ArrowLeft" size={20} />
      </button>
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Маржинальность урока
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Юнит — одно проведённое занятие целиком. Индивидуальные и групповые
          считаем отдельно, по факту месяца из CRM
        </p>
      </div>
      <button
        onClick={onDownloadPdf}
        disabled={pdfDisabled || pdfLoading}
        className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        <Icon
          name={pdfLoading ? 'Loader2' : 'FileDown'}
          size={16}
          className={pdfLoading ? 'animate-spin' : ''}
        />
        Скачать PDF
      </button>
    </div>
  );
}