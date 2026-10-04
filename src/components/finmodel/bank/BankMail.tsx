import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { BankData, checkBankMail, setMailSenders } from '@/lib/bankApi';

interface Props {
  data: BankData;
  onChanged: () => Promise<void>;
}

const BankMail = ({ data, onChanged }: Props) => {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [edit, setEdit] = useState(false);
  const [senders, setSenders] = useState(data.mail_senders);

  const check = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await checkBankMail();
      setMsg({ ok: true, text: r.letters ? `Новых писем с выписками: ${r.letters}, новых операций: ${r.inserted}` : 'Новых писем с выписками нет' });
      await onChanged();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Не удалось проверить почту' });
    } finally {
      setBusy(false);
    }
  };

  const saveSenders = async () => {
    setBusy(true);
    try {
      await setMailSenders(senders);
      setEdit(false);
      await onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
      <div className="flex flex-wrap items-start gap-3">
        <Icon name="Mail" size={18} className="text-gray-500 mt-0.5" />
        <div className="flex-1 min-w-[240px]">
          <div className="font-medium text-gray-900">Выписки с почты</div>
          <div className="text-xs text-gray-500">
            Банки присылают выписку 1С на abram.viktoriya.00@mail.ru — вложением или ссылкой «Скачать». Почта проверяется при открытии
            финмодели, не чаще раза в 6 часов.
            {data.mail_checked_at && ` Последняя проверка: ${new Date(`${data.mail_checked_at}Z`).toLocaleString('ru-RU')}.`}
          </div>
        </div>
        <button disabled={busy} onClick={check}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          <Icon name={busy ? 'Loader2' : 'MailCheck'} size={15} className={busy ? 'animate-spin' : ''} />
          Проверить сейчас
        </button>
      </div>

      <div className="text-xs text-gray-500 flex flex-wrap items-center gap-2">
        Отправители:
        {edit ? (
          <>
            <input value={senders} onChange={(e) => setSenders(e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-xs w-72" />
            <button disabled={busy} onClick={saveSenders} className="text-indigo-600 hover:underline">сохранить</button>
          </>
        ) : (
          <>
            <span className="font-mono text-gray-700">{data.mail_senders}</span>
            <button onClick={() => setEdit(true)} className="text-indigo-600 hover:underline">изменить</button>
          </>
        )}
      </div>

      {msg && <div className={`text-sm rounded-lg px-3 py-2 ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>{msg.text}</div>}

      {data.mail_log.filter((l) => !l.message_id.startsWith('retry')).length > 0 && (
        <table className="w-full text-xs">
          <tbody>
            {data.mail_log.filter((l) => !l.message_id.startsWith('retry')).map((l) => (
              <tr key={l.message_id} className="border-t border-gray-100">
                <td className="py-1.5 pr-3 text-gray-500 whitespace-nowrap">
                  {l.received_at ? new Date(`${l.received_at}Z`).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                </td>
                <td className="py-1.5 pr-3 text-gray-700">{l.subject}</td>
                <td className="py-1.5 text-right whitespace-nowrap">
                  {l.files > 0 ? (
                    <span className="text-emerald-700">загружено · новых {l.inserted}</span>
                  ) : (
                    <span className="text-rose-600" title={l.error}>{l.error.slice(0, 80) || 'нет выписки'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BankMail;
