import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import LetterheadSheet, { LetterData } from '@/components/letterhead/LetterheadSheet';
import { savePaperToPdf } from '@/lib/letterheadPdf';
import { ORG_DETAILS } from '@/lib/orgDetails';

const today = () => new Date().toISOString().slice(0, 10);

const LetterheadView = () => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<LetterData>({
    docNumber: '',
    docDate: today(),
    recipient: '',
    title: '',
    body: '',
    signerPost: ORG_DETAILS.signerPost,
    signerName: ORG_DETAILS.signerName,
    city: 'г. Новосибирск',
    stampMode: 'none',
  });

  const set = (k: keyof LetterData, v: string) =>
    setData((p) => ({ ...p, [k]: v } as LetterData));

  const savePdf = async () => {
    if (!sheetRef.current) return;
    setSaving(true);
    try {
      const name = data.docNumber ? `Бланк_${data.docNumber}` : `Бланк_${data.docDate}`;
      await savePaperToPdf(sheetRef.current, `${name}.pdf`);
    } finally {
      setSaving(false);
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

          <Button onClick={savePdf} disabled={saving} className="w-full bg-green-600 hover:bg-green-700">
            <Icon name={saving ? 'Loader2' : 'Download'} size={16} className={`mr-2 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Готовим файл…' : 'Сохранить PDF'}
          </Button>
        </div>

        <div className="overflow-x-auto pb-4">
          <LetterheadSheet ref={sheetRef} data={data} />
        </div>
      </div>
    </div>
  );
};

export default LetterheadView;