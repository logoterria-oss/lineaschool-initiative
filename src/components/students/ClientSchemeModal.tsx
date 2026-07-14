import { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Icon from '@/components/ui/icon';

type Card = {
  title: string;
  tag?: string;
  tagColor?: string;
  steps: string[];
  fix?: string;
};

const CARDS: Card[] = [
  {
    title: 'КЛИЕНТЫ',
    tag: 'не срочно',
    tagColor: '#e5ebf3',
    steps: [
      '<b>Напиши</b> вопрос в ЛинэяСкул-мессенджер.',
      '<b>Жди</b> ответа 24 часа.',
      'Если нет ответа — <b>позвони</b>.',
      'Если недозвон — <b>напиши</b> во внешний канал (Мах / Telegram).',
      'Если нет ответа, повтори шаги 3–4 через 3 дня. Всего 2 цикла. Затем стоп на 2 недели.',
    ],
    fix: 'После любого действия и ответа — зафиксируй итог в CRM и админке сайта.',
  },
  {
    title: 'КЛИЕНТЫ',
    tag: 'срочно',
    tagColor: '#f5d6d6',
    steps: [
      '<b>Напиши</b> вопрос в ЛинэяСкул-мессенджер.',
      'Сразу же <b>продублируй</b> во внешний канал (Мах или Telegram).',
      'Если через 1 час нет ответа нигде — <b>звони</b>.',
      'Если недозвон — <b>перезвонить</b> через 30–60 мин.',
    ],
    fix: 'После любого действия и ответа — зафиксируй итог в CRM и админке сайта.',
  },
  {
    title: 'ЛИДЫ',
    steps: [
      '<b>Позвони</b> и задай вопрос.',
      'Если игнор — <b>напиши</b> во внешний канал (Мах или Telegram).',
      '<b>Жди</b> 24 часа.',
      'Если ответа нет — <b>повторный звонок</b>.',
      'Если опять нет ответа — отправь второе сообщение в духе: «Предложение ещё актуально. Если не интересно — просто напишите "нет"».',
      'Через 2 дня — <b>финальный звонок</b>. Если не ответил — закрой лида (статус «недозвон»), больше не трогай.',
    ],
  },
];

const SchemeContent = () => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#1a2634', background: '#ffffff' }}>
    <h1
      style={{
        fontSize: 26,
        borderBottom: '2px solid #1a2634',
        paddingBottom: 8,
        margin: '0 0 6px',
      }}
    >
      Схема взаимодействия с клиентами и лидами
    </h1>
    <div style={{ fontSize: 15, color: '#3e5268', marginBottom: 22 }}>
      Три ситуации — три плана действий.
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
      {CARDS.map((c, ci) => (
        <div
          key={ci}
          style={{
            flex: '1 1 260px',
            background: '#ffffff',
            border: '1px solid #dce2ec',
            borderRadius: 10,
            padding: '16px 18px 20px',
          }}
        >
          <h2
            style={{
              fontSize: 18,
              margin: '0 0 14px',
              paddingBottom: 8,
              borderBottom: '2px solid #e5ebf3',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {c.title}
            {c.tag && (
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  background: c.tagColor,
                  padding: '2px 12px',
                  borderRadius: 20,
                  marginLeft: 6,
                }}
              >
                {c.tag}
              </span>
            )}
          </h2>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {c.steps.map((s, i) => (
              <li
                key={i}
                style={{
                  paddingLeft: 32,
                  position: 'relative',
                  marginBottom: 10,
                  lineHeight: 1.5,
                  fontSize: 14,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    fontWeight: 700,
                    fontSize: 13,
                    background: '#eef2f7',
                    color: '#1a2634',
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {i + 1}
                </span>
                <span dangerouslySetInnerHTML={{ __html: s }} />
              </li>
            ))}
          </ol>
          {c.fix && (
            <div
              style={{
                marginTop: 16,
                paddingTop: 12,
                borderTop: '1px dashed #dce2ec',
                fontSize: 13,
                color: '#1f334a',
              }}
            >
              {c.fix}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

const ClientSchemeModal = ({ onClose }: { onClose: () => void }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const handlePdf = async () => {
    if (!contentRef.current) return;
    setSaving(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;
      pdf.addImage(imgData, 'PNG', margin, margin, imgW, Math.min(imgH, pageH - margin * 2));
      pdf.save('Схема-взаимодействия-с-клиентами.pdf');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative my-8 w-full max-w-5xl rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end gap-2 p-3 border-b border-gray-100">
          <button
            type="button"
            onClick={handlePdf}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
          >
            <Icon name={saving ? 'Loader' : 'Download'} size={16} className={saving ? 'animate-spin' : ''} />
            {saving ? 'Сохраняю…' : 'Сохранить PDF'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            title="Закрыть"
          >
            <Icon name="X" size={20} />
          </button>
        </div>
        <div className="p-6">
          <div ref={contentRef} className="bg-white p-2">
            <SchemeContent />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ClientSchemeHint = ({ className = 'mb-4' }: { className?: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 self-start rounded-xl border border-purple-100 bg-purple-50/60 p-3 text-left hover:bg-purple-50 ${className}`}
      >
        <Icon name="Network" size={16} className="text-purple-600 flex-shrink-0" />
        <span className="flex-1 text-sm font-semibold text-purple-800">
          Схема взаимодействия с клиентами и лидами
        </span>
        <Icon name="ExternalLink" size={16} className="text-purple-500" />
      </button>
      {open && <ClientSchemeModal onClose={() => setOpen(false)} />}
    </>
  );
};

export default ClientSchemeHint;