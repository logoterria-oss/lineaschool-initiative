import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { ScheduleFinding } from '@/lib/adminShiftsApi';
import { copyToClipboard } from '@/lib/payLinks';
import { MarkState } from './useShiftChecklist';
import { ScheduleCheckState, findingKey } from './useScheduleChecks';

interface Props {
  num: number;
  title: string;
  sections: ScheduleCheckState[];
  /** Дата вчерашнего дня — подписываем её в пункте «Вчерашний день» */
  yesterday: string;
  loading: boolean;
  failed: boolean;
  /** Проверку в CRM уже запускали — есть результат */
  checked: boolean;
  allDone: boolean;
  marks: Record<string, MarkState>;
  readOnly?: boolean;
  onMark: (key: string, p: MarkState) => void;
}

const fmtShort = (d: string) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : '';

/** Подпись находки: ФИО ученика как в CRM либо название группы */
const findingLabel = (f: ScheduleFinding) => f.name || f.title || `#${f.id}`;

/** Вторая строка находки: время, педагог и уточнения по подпункту */
const findingNote = (f: ScheduleFinding): string => {
  const parts: string[] = [];
  if (f.time) parts.push(f.time);
  if (f.teacher && f.teacher !== '—') parts.push(f.teacher);
  if (f.name && f.title && f.title !== f.name) parts.push(f.title);
  if (f.form) parts.push(f.form);
  if (f.tariff) parts.push(f.tariff);
  if (typeof f.paid_left === 'number') parts.push(`оплачено занятий: ${f.paid_left}`);
  if (typeof f.balance === 'number') parts.push(`баланс ${f.balance} ₽`);
  if (f.students?.length) parts.push(`остались: ${f.students.join(', ')}`);
  if (f.cancelled?.length) parts.push(`отменили: ${f.cancelled.join(', ')}`);
  return parts.join(' · ');
};

/** Ссылка на оплату рядом с учеником: копируем и отправляем родителю */
const PayLinkButton = ({ url, label }: { url: string; label: string }) => {
  const [copied, setCopied] = useState(false);

  const copy = async (e: React.MouseEvent) => {
    // Клик по ссылке не должен закрывать пункт чек-листа
    e.stopPropagation();
    const ok = await copyToClipboard(url);
    if (!ok) {
      window.prompt('Скопируйте ссылку:', url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span
      onClick={copy}
      role="button"
      tabIndex={-1}
      title={`${label}: ${url}`}
      className="shrink-0 inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10.5px] font-medium text-blue-700 hover:bg-blue-100"
    >
      <Icon name={copied ? 'Check' : 'Link'} size={11} />
      {copied ? 'Скопировано' : 'Ссылка'}
    </span>
  );
};

/**
 * Пункт чек-листа с проверками по AlfaCRM («Вчерашний день», «Расписание на сегодня»).
 * Запрос в CRM тяжёлый, поэтому идёт только по общей кнопке «Проверить в CRM»
 * в шапке чек-листа. Чистая проверка — короткий ответ и зелёная галка,
 * находки — список с галочками.
 */
const ScheduleChecksCard = ({
  num,
  title,
  sections,
  yesterday,
  loading,
  failed,
  checked,
  allDone,
  marks,
  readOnly,
  onMark,
}: Props) => {
  const isYesterday = sections.some((s) => s.group === 'yesterday');

  return (
  <div
    className={`rounded-xl border px-3 py-2.5 transition-colors ${
      checked && allDone && !failed ? 'border-green-200 bg-green-50/60' : 'border-gray-200 bg-white'
    }`}
  >
    <div className="flex items-start gap-2.5">
      <div
        className={`mt-0.5 shrink-0 ${
          checked && allDone && !failed ? 'text-green-600' : 'text-gray-300'
        }`}
      >
        <Icon name={checked && allDone && !failed ? 'CircleCheck' : 'Circle'} size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <div
          className={`text-sm leading-snug ${
            checked && allDone && !failed ? 'text-gray-500' : 'text-gray-900'
          }`}
        >
          <span className="text-gray-400 mr-1.5">{num}.</span>
          {title}
          {isYesterday && yesterday && (
            <span className="text-gray-400"> — {fmtShort(yesterday)}</span>
          )}
        </div>

        {loading && <div className="mt-2 text-[11px] text-gray-400">Смотрим CRM…</div>}

        {!checked && !loading && !failed && (
          <div className="mt-2 text-[11px] text-gray-400">
            Данные из CRM не запрашивались — нажмите «Проверить в CRM» вверху.
          </div>
        )}

        {failed && !loading && (
          <div className="mt-2 text-[11px] text-red-500">
            CRM не ответила — проверьте расписание вручную или нажмите кнопку ещё раз.
          </div>
        )}

        {checked && !loading && (
          <div className="mt-2 space-y-2">
            {sections.map((s) => (
              <div key={s.key} className="rounded-lg border border-gray-200 bg-gray-50/70 px-2.5 py-2">
                <div className="flex items-start gap-1.5 text-[12px] leading-snug text-gray-700">
                  <span className="text-gray-400">{s.letter})</span>
                  <span className="flex-1">{s.title}</span>
                  {!s.clean && (
                    <span className="shrink-0 text-[10px] font-medium bg-amber-100 text-amber-700 rounded px-1.5 py-0.5">
                      {s.findings.length}
                    </span>
                  )}
                </div>

                {s.clean ? (
                  <div className="mt-1 ml-4 flex items-center gap-1.5 text-[12px] text-green-600">
                    <Icon name="Check" size={13} />
                    <span className="text-gray-400">{s.empty}</span>
                  </div>
                ) : (
                  <div className="mt-1.5 ml-4 space-y-1">
                    {s.action && (
                      <div className="text-[10.5px] text-gray-400">→ {s.action}</div>
                    )}
                    {s.findings.map((f) => {
                      const key = findingKey(s.key, f.id);
                      const m = marks[key] || { done: false, comment: '' };
                      const note = findingNote(f);
                      return (
                        <div
                          key={key}
                          onClick={() =>
                            !readOnly && onMark(key, { done: !m.done, comment: m.comment })
                          }
                          className={`w-full flex items-start gap-2 text-left rounded-md border px-2 py-1.5 transition-colors ${
                            m.done
                              ? 'border-green-200 bg-green-50 text-gray-400'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          <Icon
                            name={m.done ? 'SquareCheck' : 'Square'}
                            size={15}
                            className={`mt-px shrink-0 ${m.done ? 'text-green-600' : 'text-gray-300'}`}
                          />
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block text-[12px] leading-snug ${
                                m.done ? 'line-through' : 'text-gray-900'
                              }`}
                            >
                              {findingLabel(f)}
                            </span>
                            {note && (
                              <span className="block text-[10.5px] text-gray-400 mt-px">{note}</span>
                            )}
                          </span>
                          {f.payUrl && !m.done && (
                            <PayLinkButton url={f.payUrl} label={f.payLabel || 'Оплата'} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
  );
};

export default ScheduleChecksCard;