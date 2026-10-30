import { Agg, Quarter, TONE_CLASSES, avgOf, formatMinutes, responseLevel } from './kpiSummary';

// Расшифровка скорости ответа по месяцам квартала
const ResponseMonths = ({
  quarter, byMonth, showMoney = false,
}: { quarter: Quarter; byMonth: Record<string, Agg>; showMoney?: boolean }) => (
  <div className="grid sm:grid-cols-3 gap-2">
    {quarter.months.map((m) => {
      const a = byMonth[m.id];
      const avg = avgOf(a);
      const lvl = avg != null ? responseLevel(avg) : null;
      return (
        <div key={m.id} className="rounded-lg bg-gray-50 px-3 py-2">
          <div className="text-xs text-gray-500">{m.label}</div>
          {avg == null || !lvl ? (
            <div className="text-sm text-gray-400">Нет данных</div>
          ) : (
            <>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-gray-900">{formatMinutes(avg)}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${TONE_CLASSES[lvl.tone]}`}>{lvl.label}</span>
              </div>
              <div className="text-xs text-gray-500">
                Диалогов: {a.dialogs}
                {showMoney && <> · премия {Math.round((240 * lvl.percent) / 100)} ₽</>}
              </div>
            </>
          )}
        </div>
      );
    })}
  </div>
);

export default ResponseMonths;
