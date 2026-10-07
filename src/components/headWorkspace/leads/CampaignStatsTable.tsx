import { CampaignRow } from '@/lib/leadsApi';
import Icon from '@/components/ui/icon';

interface Props {
  title: string;
  hint?: string;
  rows: CampaignRow[];
  firstCol: string;
}

function convColor(v: number): string {
  if (v >= 30) return 'text-green-600';
  if (v >= 10) return 'text-amber-600';
  return 'text-gray-500';
}

// Таблица эффективности: сколько лидов дала кампания/источник
// и сколько из них дошли до диагностики и стали клиентами.
export default function CampaignStatsTable({ title, hint, rows, firstCol }: Props) {
  const max = Math.max(1, ...rows.map((r) => r.total));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
        <Icon name="Target" size={15} className="text-amber-600" />
        {title}
      </h3>
      {hint && <p className="text-[11px] text-gray-400 mt-0.5 mb-3">{hint}</p>}

      {rows.length === 0 ? (
        <div className="text-sm text-gray-400 py-2">Нет данных за период</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                <th className="text-left font-semibold py-1.5 pr-3">{firstCol}</th>
                <th className="text-right font-semibold py-1.5 px-2">Лиды</th>
                <th className="text-right font-semibold py-1.5 px-2">Диагн.</th>
                <th className="text-right font-semibold py-1.5 px-2">Клиенты</th>
                <th className="text-right font-semibold py-1.5 px-2">→ Диагн.</th>
                <th className="text-right font-semibold py-1.5 pl-2">→ Клиент</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const noUtm = r.name === 'Без UTM-метки' || r.name === 'Прямой заход / вручную';
                return (
                  <tr key={r.name} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-3 min-w-[180px]">
                      <div className={`font-medium break-all ${noUtm ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                        {r.name}
                      </div>
                      {(r.source || r.medium) && r.name !== r.source && (
                        <div className="text-[11px] text-gray-400">
                          {[r.source, r.medium].filter(Boolean).join(' / ')}
                        </div>
                      )}
                      <div className="h-1 mt-1 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${noUtm ? 'bg-gray-300' : 'bg-amber-400'}`}
                          style={{ width: `${(r.total / max) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="text-right px-2 font-semibold text-gray-900">{r.total}</td>
                    <td className="text-right px-2 text-gray-700">{r.diag}</td>
                    <td className="text-right px-2 text-green-700 font-medium">{r.clients}</td>
                    <td className={`text-right px-2 font-semibold ${convColor(r.conv_to_diag)}`}>{r.conv_to_diag}%</td>
                    <td className={`text-right pl-2 font-semibold ${convColor(r.conv_to_client)}`}>{r.conv_to_client}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
