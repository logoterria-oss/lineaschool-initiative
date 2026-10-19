import { useState } from 'react';
import Icon from '@/components/ui/icon';
import {
  PaymentReminder,
  REMINDER_CHANNELS,
  ReminderChannel,
  ScheduleFinding,
  createReminderDraft,
  markReminder,
} from '@/lib/adminShiftsApi';
import { copyToClipboard } from '@/lib/payLinks';
import { interactionMessageUrl } from '@/lib/paymentReminder';

interface Props {
  kind: 'm3a' | 'm3b';
  finding: ScheduleFinding;
  label: string;
  note: string;
  reminder?: PaymentReminder;
  readOnly?: boolean;
  onChange: () => void;
}

const channelLabel = (c: string | null) =>
  REMINDER_CHANNELS.find((x) => x.id === c)?.label || 'отправлено';

const fmtTime = (s: string | null) => {
  if (!s) return '';
  const [d, t] = s.split('T');
  const [, m, day] = d.split('-');
  return `${day}.${m} ${t || ''}`.trim();
};

/**
 * Ученик в пункте «Остаток занятий».
 * «Написать» открывает «Окно взаимодействия» с готовым текстом — после отправки
 * Окно само отмечает напоминание. Если писали не через Окно, админ выбирает канал вручную.
 * Отметки общие: что отметил один админ, видят все.
 */
const ReminderRow = ({ kind, finding: f, label, note, reminder, readOnly, onChange }: Props) => {
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [copied, setCopied] = useState(false);
  const done = !!reminder;
  const target = {
    crm_customer_id: Number(f.crmCustomerId || f.id),
    kind,
    fingerprint: f.fingerprint || '',
    student_name: f.name,
  };

  const write = async () => {
    const text = f.message || '';
    // Окно открываем сразу, иначе браузер посчитает вкладку всплывающим окном
    const win = window.open('about:blank', '_blank');
    const id = await createReminderDraft({ ...target, message: text });
    const url = interactionMessageUrl({ crmCustomerId: target.crm_customer_id, text, reminderId: id });
    if (win) win.location.href = url;
    else window.open(url, '_blank');
  };

  const copy = async () => {
    const ok = await copyToClipboard(f.message || '');
    if (!ok) {
      window.prompt('Скопируйте текст:', f.message || '');
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const mark = async (channel?: ReminderChannel) => {
    setBusy(true);
    setPicking(false);
    await markReminder({ ...target, done: !!channel, channel });
    await onChange();
    setBusy(false);
  };

  return (
    <div
      className={`rounded-md border px-2 py-1.5 transition-colors ${
        done ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-2">
        <Icon
          name={done ? 'SquareCheck' : 'Square'}
          size={15}
          className={`mt-px shrink-0 ${done ? 'text-green-600' : 'text-gray-300'}`}
        />
        <span className="min-w-0 flex-1">
          <span
            className={`block text-[12px] leading-snug ${
              done ? 'text-gray-400 line-through' : 'text-gray-900'
            }`}
          >
            {label}
          </span>
          {note && <span className="block text-[10.5px] text-gray-400 mt-px">{note}</span>}
          {done && (
            <span className="mt-0.5 flex items-center gap-1 text-[10.5px] text-green-700">
              <Icon name="Send" size={11} />
              Предупреждён: {channelLabel(reminder.channel)}
              {reminder.staff_name ? ` · ${reminder.staff_name}` : ''}
              {reminder.sent_at ? ` · ${fmtTime(reminder.sent_at)}` : ''}
            </span>
          )}
        </span>

        {!readOnly && !done && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={write}
              disabled={busy || !f.message}
              title="Открыть «Окно взаимодействия» с готовым сообщением"
              className="inline-flex items-center gap-1 rounded-md bg-green-500 px-1.5 py-0.5 text-[10.5px] font-medium text-white hover:bg-green-600 disabled:opacity-50"
            >
              <Icon name="MessageSquareText" size={11} />
              Написать
            </button>
            <button
              type="button"
              onClick={copy}
              title="Скопировать текст сообщения"
              className="inline-flex items-center rounded-md border border-gray-200 bg-white p-0.5 text-gray-500 hover:bg-gray-50"
            >
              <Icon name={copied ? 'Check' : 'Copy'} size={12} />
            </button>
            <button
              type="button"
              onClick={() => setPicking((v) => !v)}
              disabled={busy}
              title="Отметить вручную, куда отправлено"
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[10.5px] font-medium text-gray-600 hover:bg-gray-50"
            >
              <Icon name="Check" size={11} />
              Отправлено
            </button>
          </div>
        )}

        {!readOnly && done && (
          <button
            type="button"
            onClick={() => mark()}
            disabled={busy}
            title="Снять отметку"
            className="shrink-0 rounded-md p-0.5 text-gray-400 hover:bg-white hover:text-red-500"
          >
            <Icon name="Undo2" size={13} />
          </button>
        )}
      </div>

      {picking && !done && (
        <div className="mt-1.5 ml-6 flex flex-wrap items-center gap-1">
          <span className="text-[10.5px] text-gray-400">Куда отправили:</span>
          {REMINDER_CHANNELS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => mark(c.id)}
              className="rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10.5px] font-medium text-blue-700 hover:bg-blue-100"
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReminderRow;
