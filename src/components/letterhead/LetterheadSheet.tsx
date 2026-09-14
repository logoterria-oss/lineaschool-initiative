import { forwardRef } from 'react';
import { ORG_DETAILS as O } from '@/lib/orgDetails';
import { Block, Piece, Requisites, parseBlocks } from '@/lib/letterheadMarkup';

export interface LetterData {
  docNumber: string;
  docDate: string;
  recipient: string;
  title: string;
  body: string;
  signerPost: string;
  signerName: string;
  city: string;
  stampMode: 'none' | 'mp' | 'note';
  requisites: Requisites;
  showSignature: boolean;
}

const dmy = (iso: string) => {
  if (!iso) return '«____» ______________ 20___ г.';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
};

const Inline = ({ pieces }: { pieces: Piece[] }) => (
  <>
    {pieces.map((p, i) =>
      p.bold ? <b key={i}>{p.text}</b> : <span key={i}>{p.text}</span>,
    )}
  </>
);

const RenderBlock = ({ b }: { b: Block }) => {
  if (b.kind === 'space') return <div style={{ height: 8 }} />;
  if (b.kind === 'heading')
    return (
      <div
        style={{
          textAlign: 'center',
          fontWeight: 700,
          fontSize: b.level === 1 ? 14.5 : 13.5,
          margin: '12px 0 7px',
          lineHeight: 1.35,
        }}
      >
        <Inline pieces={b.pieces} />
      </div>
    );
  return (
    <div style={{ textAlign: 'justify', lineHeight: 1.55, marginBottom: 1 }}>
      <Inline pieces={b.pieces} />
    </div>
  );
};

const SIG_CAP: React.CSSProperties = { fontSize: 9, color: '#666', paddingTop: 3 };

const ReqColumn = ({
  title,
  body,
  sign,
  date,
}: {
  title: string;
  body: string;
  sign: string;
  date: string;
}) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{title}</div>
    <div style={{ fontSize: 12.5, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{body}</div>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 26 }}>
      <div style={{ width: 130, borderBottom: '1px solid #000', height: 14 }} />
      <div style={{ fontSize: 12.5 }}>/ {sign} /</div>
    </div>
    <div style={{ display: 'flex', gap: 34, ...SIG_CAP }}>
      <span style={{ width: 130, textAlign: 'center' }}>(подпись)</span>
      <span>(расшифровка)</span>
    </div>
    <div style={{ fontSize: 12.5, marginTop: 18 }}>{date}</div>
  </div>
);

const SHEET: React.CSSProperties = {
  width: 794,
  minHeight: 1123,
  padding: '53px 57px 60px 76px',
  fontFamily: '"Noto Sans", Arial, sans-serif',
  fontSize: 13,
  color: '#000',
  display: 'flex',
  flexDirection: 'column',
};

const LetterheadSheet = forwardRef<HTMLDivElement, { data: LetterData }>(({ data }, ref) => {
  const blocks = parseBlocks(data.body);
  const r = data.requisites;

  return (
    <div ref={ref} className="mx-auto flex flex-col gap-5" style={{ width: 794 }}>
    <div
      className="bg-white shadow-lg"
      style={SHEET}
    >
      <div style={{ textAlign: 'center', lineHeight: 1.35 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em' }}>
          ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, marginTop: 3, whiteSpace: 'nowrap' }}>
          {O.personName.toUpperCase()}
        </div>
        <div style={{ fontSize: 10.5, marginTop: 6 }}>
          ОГРНИП {O.ogrnip} · ИНН {O.inn}
        </div>
        <div style={{ fontSize: 10.5, marginTop: 2 }}>{O.address}</div>
        <div style={{ fontSize: 10.5, marginTop: 2 }}>
          Тел.: {O.phone} · E-mail: {O.email} · {O.site}
        </div>
      </div>

      <div style={{ borderTop: '2px solid #000', margin: '10px 0 3px' }} />
      <div style={{ borderTop: '1px solid #000', marginBottom: 20 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 30, fontSize: 12.5 }}>
        <div style={{ whiteSpace: 'nowrap' }}>
          {data.docDate || data.docNumber ? (
            <>
              от {dmy(data.docDate)}
              {data.docNumber ? ` № ${data.docNumber}` : ''}
            </>
          ) : null}
        </div>
        {data.recipient && (
          <div style={{ width: 290, whiteSpace: 'pre-wrap', lineHeight: 1.4, textAlign: 'right' }}>
            {data.recipient}
          </div>
        )}
      </div>

      {data.title.trim() && (
        <div
          style={{
            textAlign: 'center',
            fontSize: 15,
            fontWeight: 700,
            margin: '26px 0 16px',
            lineHeight: 1.4,
            whiteSpace: 'pre-wrap',
          }}
        >
          {data.title}
        </div>
      )}

      <div style={{ marginTop: data.title.trim() ? 0 : 26 }}>
        {blocks.map((b, i) => (
          <RenderBlock key={i} b={b} />
        ))}
      </div>

      {data.showSignature && (
        <div style={{ marginTop: 'auto', paddingTop: 44, fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            <div style={{ flex: 1 }}>{data.signerPost}</div>
            <div style={{ width: 130 }}>
              <div style={{ borderBottom: '1px solid #000', height: 16 }} />
              <div style={{ ...SIG_CAP, textAlign: 'center' }}>подпись</div>
            </div>
            <div style={{ width: 170 }}>
              <div style={{ height: 16, whiteSpace: 'nowrap' }}>{data.signerName}</div>
              <div style={{ ...SIG_CAP, textAlign: 'center' }}>расшифровка подписи</div>
            </div>
          </div>

          {(data.stampMode !== 'none' || data.city) && (
            <div style={{ marginTop: 18, fontSize: 11.5, color: '#555' }}>
              {data.stampMode === 'mp' && 'М.П.   '}
              {data.stampMode === 'note' && 'Печать не используется   '}
              {data.city}
            </div>
          )}
        </div>
      )}
    </div>

    {r.enabled && (
      <div className="bg-white shadow-lg" style={SHEET}>
        {r.heading?.trim() && (
          <div
            style={{
              textAlign: 'center',
              fontWeight: 700,
              fontSize: 14.5,
              marginBottom: 22,
              lineHeight: 1.35,
            }}
          >
            {r.heading}
          </div>
        )}
        <div style={{ display: 'flex', gap: 26 }}>
          <ReqColumn title={r.leftTitle} body={r.leftBody} sign={r.leftSign} date={r.leftDate} />
          <ReqColumn
            title={r.rightTitle}
            body={r.rightBody}
            sign={r.rightSign}
            date={r.rightDate}
          />
        </div>
      </div>
    )}
    </div>
  );
});

LetterheadSheet.displayName = 'LetterheadSheet';

export default LetterheadSheet;