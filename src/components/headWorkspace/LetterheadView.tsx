import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import LetterheadSheet, { LetterData } from '@/components/letterhead/LetterheadSheet';
import { savePaperToPdf, paperToPdfBase64, buildDocFileName } from '@/lib/letterheadPdf';
import { ORG_DETAILS } from '@/lib/orgDetails';
import { LETTERHEAD_DOCS_URL, SavedDoc } from '@/lib/letterheadApi';
import { encodeMeta } from '@/lib/letterheadParse';
import ImportDocPanel from '@/components/letterhead/ImportDocPanel';

const today = () => new Date().toISOString().slice(0, 10);

interface Props {
  initial?: SavedDoc | null;
  onSaved?: () => void;
}

const LetterheadView = ({ initial = null, onSaved }: Props) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archived, setArchived] = useState(false);
  const [data, setData] = useState<LetterData>(
    initial
      ? {
          docNumber: initial.doc_number || '',
          docDate: initial.doc_date ? initial.doc_date.slice(0, 10) : today(),
          recipient: initial.recipient || '',
          title: initial.title || '',
          body: initial.body || '',
          signerPost: initial.signer_post || ORG_DETAILS.signerPost,
          signerName: initial.signer_name || ORG_DETAILS.signerName,
          city: initial.city || 'г. Новосибирск',
          stampMode: (initial.stamp_mode as LetterData['stampMode']) || 'none',
        }
      : {
          docNumber: '',
          docDate: today(),
          recipient: '',
          title: '',
          body: '',
          signerPost: ORG_DETAILS.signerPost,
          signerName: ORG_DETAILS.signerName,
          city: 'г. Новосибирск',
          stampMode: 'none',
        },
  );

  const [imported, setImported] = useState('');

  const set = (k: keyof LetterData, v: string) => {
    setArchived(false);
    setData((p) => ({ ...p, [k]: v }) as LetterData);
  };

  const applyImport = (patch: Partial<LetterData>, note: string) => {
    setArchived(false);
    setImported(note);
    setData((p) => {
      const next = { ...p };
      (Object.keys(patch) as Array<keyof LetterData>).forEach((k) => {
        const v = patch[k];
        if (v !== undefined && v !== '') (next as Record<string, unknown>)[k] = v;
      });
      return next;
    });
  };

  const fileName = buildDocFileName(data.title, ORG_DETAILS.fileSuffix);

  const savePdf = async () => {
    if (!sheetRef.current) return;
    setSaving(true);
    try {
      await savePaperToPdf(sheetRef.current, fileName, encodeMeta(data));
    } finally {
      setSaving(false);
    }
  };

  const saveToArchive = async () => {
    if (!sheetRef.current) return;
    setArchiving(true);
    try {
      const pdfBase64 = await paperToPdfBase64(sheetRef.current, encodeMeta(data));
      await fetch(LETTERHEAD_DOCS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, fileName, pdfBase64 }),
      });
      setArchived(true);
      onSaved?.();
    } finally {
      setArchiving(false);
    }
  };

  const field = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Официальный бланк организации</h1>
        <p className="text-sm text-gray-500 mt-1">
          Заполните поля — бланк соберётся автоматически, затем сохраните PDF
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] gap-6 items-start">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4 lg:sticky lg:top-4">
          <ImportDocPanel onApply={applyImport} />

          {imported && (
            <div className="flex items-start gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2.5">
              <Icon name="CircleCheck" size={14} className="mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">{imported}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Номер документа</label>
              <input
                className={field}
                value={data.docNumber}
                onChange={(e) => set('docNumber', e.target.value)}
                placeholder="12/2026"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Дата</label>
              <input
                type="date"
                className={field}
                value={data.docDate}
                onChange={(e) => set('docDate', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Кому (адресат)</label>
            <textarea
              className={`${field} min-h-[70px] resize-y`}
              value={data.recipient}
              onChange={(e) => set('recipient', e.target.value)}
              placeholder={'Директору ООО «Ромашка»\nИванову И. И.'}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-600">Заголовок</label>
              <span className="text-[11px] text-gray-400">Enter — новая строка</span>
            </div>
            <textarea
              className={`${field} min-h-[64px] resize-y leading-relaxed`}
              value={data.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder={'ЗАПРОС о заключении соглашения\nоб информационном обмене'}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-600">
                Текст: запрос, соглашение и т. д.
              </label>
              <span className="text-[11px] text-gray-400">Enter — новая строка</span>
            </div>
            <textarea
              className={`${field} min-h-[240px] resize-y leading-relaxed`}
              value={data.body}
              onChange={(e) => set('body', e.target.value)}
              placeholder="Введите текст документа…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Должность</label>
              <input
                className={field}
                value={data.signerPost}
                onChange={(e) => set('signerPost', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Подписант</label>
              <input
                className={field}
                value={data.signerName}
                onChange={(e) => set('signerName', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Город</label>
            <input className={field} value={data.city} onChange={(e) => set('city', e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Отметка о печати</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                ['none', 'Без отметки'],
                ['note', 'Без печати'],
                ['mp', 'М.П.'],
              ] as const).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => set('stampMode', v)}
                  className={`py-2 px-2 rounded-lg text-xs font-medium border transition-all ${
                    data.stampMode === v
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              ИП не обязан иметь печать — «М.П.» нужно только если печать есть
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <div className="text-[11px] text-gray-400 truncate" title={fileName}>
              Файл: {fileName}
            </div>
            <Button
              onClick={savePdf}
              disabled={saving || archiving}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Icon
                name={saving ? 'Loader2' : 'Download'}
                size={16}
                className={`mr-2 ${saving ? 'animate-spin' : ''}`}
              />
              {saving ? 'Готовим файл…' : 'Скачать PDF'}
            </Button>
            <Button
              onClick={saveToArchive}
              disabled={saving || archiving}
              variant="outline"
              className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <Icon
                name={archiving ? 'Loader2' : archived ? 'Check' : 'Archive'}
                size={16}
                className={`mr-2 ${archiving ? 'animate-spin' : ''}`}
              />
              {archiving ? 'Сохраняем…' : archived ? 'Сохранено в архив' : 'Сохранить в архив'}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto pb-4">
          <LetterheadSheet ref={sheetRef} data={data} />
        </div>
      </div>
    </div>
  );
};

export default LetterheadView;