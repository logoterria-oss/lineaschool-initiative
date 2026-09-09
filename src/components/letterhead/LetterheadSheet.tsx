import { forwardRef } from 'react';
import { ORG_DETAILS as O } from '@/lib/orgDetails';

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
}

const dmy = (iso: string) => {
  if (!iso) return '«____» ______________ 20___ г.';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
};

const LetterheadSheet = forwardRef<HTMLDivElement, { data: LetterData }>(({ data }, ref) => (
  <div
    ref={ref}
    className="bg-white shadow-lg mx-auto"
    style={{
      width: 794,
      minHeight: 1123,
      padding: '38px 57px 45px 76px',
      fontFamily: 'Times New Roman, serif',
      color: '#000',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <div style={{ textAlign: 'center', lineHeight: 1.35 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '0.06em' }}>
        ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ
      </div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: '0.02em',
          marginTop: 3,
          whiteSpace: 'nowrap',
        }}
      >
        {O.personName.toUpperCase()}
      </div>
      <div style={{ fontSize: 11.5, marginTop: 6 }}>
        ОГРНИП {O.ogrnip} · ИНН {O.inn}
      </div>
      <div style={{ fontSize: 11.5, marginTop: 2 }}>{O.address}</div>
      <div style={{ fontSize: 11.5, marginTop: 2 }}>
        Тел.: {O.phone} · E-mail: {O.email} · {O.site}
      </div>
    </div>

    <div style={{ borderTop: '2px solid #000', margin: '12px 0 4px' }} />
    <div style={{ borderTop: '1px solid #000', marginBottom: 22 }} />

    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 30, fontSize: 13 }}>
      <div style={{ whiteSpace: 'nowrap', paddingTop: 2 }}>
        {data.docDate || data.docNumber ? (
          <>
            от {dmy(data.docDate)}
            {data.docNumber ? ` № ${data.docNumber}` : ''}
          </>
        ) : (
          <>«____» __________ 20___ г. № ______</>
        )}
      </div>
      {data.recipient && (
        <div style={{ width: 300, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{data.recipient}</div>
      )}
    </div>

    {data.title && (
      <div
        style={{
          textAlign: 'center',
          fontSize: 15,
          fontWeight: 700,
          margin: '34px 0 18px',
          lineHeight: 1.4,
          whiteSpace: 'pre-wrap',
        }}
      >
        {data.title}
      </div>
    )}

    <div
      style={{
        fontSize: 14,
        lineHeight: 1.65,
        textAlign: 'justify',
        whiteSpace: 'pre-wrap',
        marginTop: data.title ? 0 : 34,
        flex: 1,
      }}
    >
      {data.body || ' '}
    </div>

    <div style={{ marginTop: 46, fontSize: 14 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'bottom', padding: 0, lineHeight: 1.2 }}>
              {data.signerPost}
            </td>
            <td style={{ width: 20, padding: 0 }} />
            <td
              style={{
                width: 145,
                padding: 0,
                verticalAlign: 'bottom',
                borderBottom: '1px solid #000',
              }}
            />
            <td style={{ width: 20, padding: 0 }} />
            <td
              style={{
                width: 190,
                padding: 0,
                verticalAlign: 'bottom',
                textAlign: 'center',
                borderBottom: '1px solid #000',
                whiteSpace: 'nowrap',
                lineHeight: 1.2,
              }}
            >
              {data.signerName}
            </td>
          </tr>
          <tr style={{ fontSize: 9.5, color: '#555' }}>
            <td style={{ padding: 0 }} />
            <td style={{ padding: 0 }} />
            <td style={{ padding: '4px 0 0', textAlign: 'center' }}>подпись</td>
            <td style={{ padding: 0 }} />
            <td style={{ padding: '4px 0 0', textAlign: 'center' }}>расшифровка подписи</td>
          </tr>
        </tbody>
      </table>

      <table
        style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', marginTop: 30 }}
      >
        <tbody>
          <tr>
            <td
              style={{
                width: 200,
                padding: 0,
                height: 22,
                borderBottom: '1px solid #000',
                verticalAlign: 'bottom',
              }}
            />
            <td style={{ width: 20, padding: 0 }} />
            <td
              style={{
                padding: 0,
                verticalAlign: 'bottom',
                textAlign: 'right',
                fontSize: 12,
                color: '#555',
                lineHeight: 1.2,
              }}
            >
              {data.stampMode === 'mp' && 'М.П. '}
              {data.stampMode === 'note' && 'Печать не используется. '}
              {data.city}
            </td>
          </tr>
          <tr style={{ fontSize: 9.5, color: '#555' }}>
            <td style={{ padding: '4px 0 0', textAlign: 'center' }}>дата подписания</td>
            <td style={{ padding: 0 }} />
            <td style={{ padding: 0 }} />
          </tr>
        </tbody>
      </table>
    </div>
  </div>
));

LetterheadSheet.displayName = 'LetterheadSheet';

export default LetterheadSheet;