import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { fmtDate, addDays, fmtRu } from './types';
import { ScheduleType } from './pdfExportUtils';
import { useScheduleData } from './useScheduleData';
import ExportPdfPreview from './ExportPdfPreview';

interface ExportPdfModalProps {
  onClose: () => void;
}

const ExportPdfModal = ({ onClose }: ExportPdfModalProps) => {
  const {
    startDate,
    minDate,
    type,
    setType,
    building,
    error,
    printRef,
    logoData,
    ready,
    setReady,
    onDateChange,
    loadData,
    downloadPdf,
    weekdayOf,
    fmtFrom,
    indStableDays,
    groupStableDays,
    pdfBlobUrl,
    setPdfBlobUrl,
  } = useScheduleData();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h2 className="font-bold text-lg text-gray-900">Создать PDF с расписанием</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-4">
          {/* Дата старта */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Дата, с которой клиент готов начать
            </label>
            <input
              type="date"
              value={fmtDate(startDate)}
              min={fmtDate(minDate)}
              onChange={onDateChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              Окна с {fmtRu(startDate)} по {fmtRu(addDays(startDate, 6))}. Предлагаем только те, что свободны 3 недели подряд.
            </p>
          </div>

          {/* Тип занятий */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Что включить</label>
            <div className="flex gap-2 flex-wrap">
              {([
                ['individual', 'Индивидуальные'],
                ['groups', 'Групповые'],
                ['both', 'Индивидуальные + групповые'],
              ] as [ScheduleType, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => { setType(val); setReady(false); }}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    type === val
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {!ready ? (
            <Button onClick={loadData} disabled={building} className="w-full gap-2">
              {building ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="FileText" size={16} />}
              {building ? 'Загрузка…' : 'Сформировать предпросмотр'}
            </Button>
          ) : (
            <Button onClick={downloadPdf} disabled={building} className="w-full gap-2 bg-green-600 hover:bg-green-700">
              {building ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Download" size={16} />}
              {building ? 'Генерация…' : 'Скачать PDF'}
            </Button>
          )}

          {/* iOS: показываем PDF в iframe — пользователь сохраняет через «Поделиться» */}
          {pdfBlobUrl && (
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border-b border-gray-200">
                <p className="text-xs text-gray-600">
                  Нажмите <b>«Поделиться»</b> → <b>«Сохранить в файлы»</b>
                </p>
                <button onClick={() => { URL.revokeObjectURL(pdfBlobUrl); setPdfBlobUrl(''); }} className="text-gray-400 hover:text-gray-600">
                  <Icon name="X" size={16} />
                </button>
              </div>
              <iframe src={pdfBlobUrl} className="w-full h-96" title="PDF предпросмотр" />
            </div>
          )}

          {/* Предпросмотр — он же источник для PDF */}
          {ready && (
            <ExportPdfPreview
              printRef={printRef}
              logoData={logoData}
              startDate={startDate}
              type={type}
              indStableDays={indStableDays}
              groupStableDays={groupStableDays}
              weekdayOf={weekdayOf}
              fmtFrom={fmtFrom}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportPdfModal;