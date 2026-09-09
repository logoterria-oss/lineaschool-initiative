import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { LetterData } from '@/components/letterhead/LetterheadSheet';
import { parsePdfFile } from '@/lib/letterheadParse';
import { LETTERHEAD_DOCS_URL, SavedDoc } from '@/lib/letterheadApi';

interface Props {
  onApply: (patch: Partial<LetterData>, note: string) => void;
}

const fmt = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }) : '';

const docToData = (d: SavedDoc): Partial<LetterData> => ({
  docNumber: d.doc_number || '',
  docDate: d.doc_date ? d.doc_date.slice(0, 10) : '',
  recipient: d.recipient || '',
  title: d.title || '',
  body: d.body || '',
  signerPost: d.signer_post || '',
  signerName: d.signer_name || '',
  city: d.city || '',
  stampMode: (d.stamp_mode as LetterData['stampMode']) || 'none',
});

const ImportDocPanel = ({ onApply }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'saved' | 'file'>('saved');
  const [docs, setDocs] = useState<SavedDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || tab !== 'saved' || docs.length) return;
    setLoading(true);
    fetch(LETTERHEAD_DOCS_URL)
      .then((r) => r.json())
      .then((j) => setDocs(j.docs || []))
      .finally(() => setLoading(false));
  }, [open, tab]);

  const pickFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setError('');
    try {
      const res = await parsePdfFile(f);
      if (!res.data) {
        setError(res.error || 'Не удалось прочитать файл');
        return;
      }
      onApply(
        res.data,
        res.exact
          ? 'Документ загружен полностью — все поля восстановлены'
          : 'Текст распознан — проверьте, всё ли разложилось по полям',
      );
      setOpen(false);
    } catch {
      setError('Файл повреждён или это не PDF');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2.5 rounded-xl border border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50/40 px-4 py-3 text-sm text-gray-600 transition-colors"
      >
        <Icon name="Upload" size={16} className="text-gray-400" />
        Редактировать существующий документ
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-800">Взять данные из документа</div>
        <button
          onClick={() => setOpen(false)}
          className="p-1 rounded-md hover:bg-gray-200 text-gray-400"
        >
          <Icon name="X" size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ['saved', 'Из архива'],
            ['file', 'Загрузить PDF'],
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            onClick={() => {
              setTab(v);
              setError('');
            }}
            className={`py-2 rounded-lg text-xs font-medium border transition-all ${
              tab === v
                ? 'bg-white text-gray-900 border-gray-300 shadow-sm'
                : 'bg-transparent text-gray-500 border-transparent hover:bg-white/70'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5 leading-relaxed space-y-2">
          <div>{error}</div>
          <button
            onClick={() => {
              setTab('saved');
              setError('');
            }}
            className="inline-flex items-center gap-1.5 font-medium text-red-700 hover:text-red-900 underline underline-offset-2"
          >
            <Icon name="FolderOpen" size={13} />
            Открыть архив
          </button>
        </div>
      )}

      {tab === 'saved' && (
        <div className="max-h-64 overflow-y-auto space-y-1.5 -mr-1 pr-1">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-gray-500 py-4 justify-center">
              <Icon name="Loader2" size={14} className="animate-spin" />
              Загружаем…
            </div>
          )}
          {!loading && !docs.length && (
            <div className="text-xs text-gray-400 text-center py-5">Архив пока пуст</div>
          )}
          {docs.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                onApply(docToData(d), 'Данные подставлены из архива');
                setOpen(false);
              }}
              className="w-full text-left bg-white rounded-lg border border-gray-200 hover:border-green-400 px-3 py-2 transition-colors"
            >
              <div className="text-xs font-medium text-gray-900 truncate">
                {(d.title || d.file_name || 'Без названия').replace(/\n/g, ' ')}
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                {d.doc_number ? `№ ${d.doc_number} · ` : ''}
                {fmt(d.created_at)}
              </div>
            </button>
          ))}
        </div>
      )}

      {tab === 'file' && (
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            variant="outline"
            className="w-full border-gray-300"
          >
            <Icon
              name={busy ? 'Loader2' : 'FileUp'}
              size={16}
              className={`mr-2 ${busy ? 'animate-spin' : ''}`}
            />
            {busy ? 'Читаем документ…' : 'Выбрать PDF-файл'}
          </Button>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Наши бланки восстанавливаются полностью. Из чужого PDF текст разложится
            по полям приблизительно — проверьте результат.
          </p>
        </div>
      )}
    </div>
  );
};

export default ImportDocPanel;