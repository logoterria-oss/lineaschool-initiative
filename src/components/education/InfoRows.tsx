export function DocLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-purple-700 hover:underline"
    >
      открыть
    </a>
  );
}

export default function InfoRows({
  rows,
}: {
  rows: { label: string; value: React.ReactNode }[];
}) {
  return (
    <dl className="divide-y divide-gray-100">
      {rows.map((row) => (
        <div
          key={row.label}
          className="py-3 sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:gap-4"
        >
          <dt className="font-semibold text-gray-700">{row.label}</dt>
          <dd className="mt-1 sm:mt-0 text-gray-600">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
