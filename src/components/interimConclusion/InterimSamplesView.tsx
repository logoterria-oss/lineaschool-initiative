interface Props {
  samples: string[];
  date: string | null;
}

// Фото приходят и как готовый data-URL, и как «голый» base64
function toSrc(sample: string): string {
  return sample.startsWith('data:') || sample.startsWith('http')
    ? sample
    : `data:image/jpeg;base64,${sample}`;
}

function fmt(d: string | null): string {
  if (!d) return '';
  const p = d.split('-');
  return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : d;
}

/**
 * Диктант с текущей промежуточной диагностики.
 * В заключение попадает только новая работа — фото с прошлых
 * диагностик логопед видит в форме, но в документ они не идут.
 */
export default function InterimSamplesView({ samples, date }: Props) {
  const list = (samples || []).filter((s) => (s || '').trim() !== '');
  if (list.length === 0) return null;

  return (
    <section className="samples-section">
      <h2 className="mb-3 text-lg font-bold text-gray-900">
        Образец письменной работы{date ? ` от ${fmt(date)}` : ''}
      </h2>
      {/* Одна работа — во всю ширину, чтобы почерк было видно;
          несколько — в две колонки */}
      <div
        className={`samples-grid grid gap-4 ${list.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}
      >
        {list.map((sample, idx) => (
          <figure key={idx} className="sample-item rounded-lg border border-gray-200 bg-white p-2">
            <img
              src={toSrc(sample)}
              alt={`Письменная работа ${idx + 1}`}
              className="h-auto w-full rounded object-contain"
            />
            {list.length > 1 && (
              <figcaption className="mt-2 text-center text-xs text-gray-500">
                Работа {idx + 1}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}