import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { fmMoney } from '@/lib/finmodelApi';
import { BankData, importStatement, syncTapi } from '@/lib/bankApi';

interface Props {
  data: BankData;
  onChanged: () => Promise<void>;
}

const BANK_NAME: Record<string, string> = { tbank: 'Т-Бизнес', loko: 'Локо-Банк', other: 'Другой банк' };

const readFile = (f: File) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',', 2)[1] || '');
    r.onerror = () => rej(new Error('Не удалось прочитать файл'));
    r.readAsDataURL(f);
  });

const BankSources = ({ data, onChanged }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'file' | 'api' | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy('file');
    setMsg(null);
    try {
      const out: string[] = [];
      for (const f of Array.from(files)) {
        const r = await importStatement(await readFile(f));
        out.push(`${f.name}: новых ${r.inserted}, уже были ${r.skipped}`);
      }
      setMsg({ ok: true, text: out.join(' · ') });
      await onChanged();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Ошибка загрузки' });
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onSync = async () => {
    setBusy('api');
    setMsg(null);
    try {
      const r = await syncTapi();
      const errs = r.accounts.filter((a) => a.error);
      setMsg(errs.length
        ? { ok: false, text: errs.map((a) => a.error).join('; ') }
        : { ok: true, text: r.accounts.map((a) => `…${a.account.slice(-4)}: получено ${a.received}, новых ${a.inserted}`).join(' · ') || 'Нет счетов для синхронизации' });
      await onChanged();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Ошибка синхронизации' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-[260px]">
          <h2 className="text-lg font-semibold text-gray-900">Банк → Cash Flow</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Операции рабочих счетов разносятся по строкам Cash Flow правилами. Переводы между своими счетами не считаются.
            Неразнесённое попадает в «Прочее» — разнесите вручную.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept=".txt" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
          <button disabled={busy !== null} onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm disabled:opacity-50">
            <Icon name={busy === 'file' ? 'Loader2' : 'Upload'} size={15} className={busy === 'file' ? 'animate-spin' : ''} />
            Загрузить выписку 1С
          </button>
          <button disabled={busy !== null || !data.tapi_configured} onClick={onSync}
            title={data.tapi_configured ? 'Подтянуть операции Т-Бизнеса по API' : 'Сначала добавьте токен T-API'}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            <Icon name={busy === 'api' ? 'Loader2' : 'RefreshCw'} size={15} className={busy === 'api' ? 'animate-spin' : ''} />
            Синхронизировать Т-Бизнес
          </button>
        </div>
      </div>
      {msg && <div className={`text-sm rounded-lg px-3 py-2 ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>{msg.text}</div>}
      {!data.tapi_configured && (
        <div className="text-xs text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
          Т-Бизнес по API ещё не подключён: нужен токен T-API. Пока можно загружать выписку файлом — данные будут те же.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.accounts.map((a) => (
          <div key={a.account} className={`rounded-lg border p-3 text-sm ${a.use_in_cf ? 'border-gray-200' : 'border-dashed border-gray-200 opacity-70'}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium text-gray-900">{BANK_NAME[a.bank]}</div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${a.use_in_cf ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {a.use_in_cf ? 'в Cash Flow' : 'личный, не учитывается'}
              </span>
            </div>
            <div className="text-xs text-gray-500">{a.label} · …{a.account.slice(-4)}</div>
            <div className="mt-2 text-gray-900 tabular-nums font-semibold">
              {a.last_balance ? fmMoney(Number(a.last_balance.balance_end)) : '—'}
              {a.last_balance && <span className="text-xs font-normal text-gray-400"> на {new Date(a.last_balance.date).toLocaleDateString('ru-RU')}</span>}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              {a.api ? (a.last_sync_at ? `API: ${new Date(a.last_sync_at).toLocaleString('ru-RU')}` : 'API: ещё не синхронизирован') : 'только выписка файлом'}
              {a.last_import_at && ` · файл: ${new Date(a.last_import_at).toLocaleDateString('ru-RU')}`}
            </div>
            {a.last_sync_error && <div className="text-[11px] text-rose-600 mt-1">{a.last_sync_error}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BankSources;
