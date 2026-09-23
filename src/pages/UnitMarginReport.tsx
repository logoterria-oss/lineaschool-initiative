import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import UnitMonthPicker from '@/components/unitMargin/UnitMonthPicker';
import UnitRatesForm from '@/components/unitMargin/UnitRatesForm';
import UnitResultCard from '@/components/unitMargin/UnitResultCard';
import UnitTeachersTable from '@/components/unitMargin/UnitTeachersTable';
import {
  UnitFact, UnitMarginReport as SavedReport,
  deleteUnitReport, fetchUnitDefaults, fetchUnitFact, fetchUnitReports,
  saveUnitDefaults, saveUnitReport,
} from '@/lib/unitMarginApi';
import {
  DEFAULT_RATES, DEFAULT_TEACHER_RATE, UnitMarginInputs,
  calcAll, fmtMoney2, fmtPercent, lastClosedMonth, monthLabel,
} from '@/lib/unitMarginModel';

/**
 * Отчёт «Маржинальность урока».
 *
 * Руководитель выбирает ТОЛЬКО месяц. Средние цены индивидуального и
 * группового урока берутся из факта CRM за этот месяц, ставки педагогов и
 * проценты — из сохранённого пресета. Два расчёта идут параллельно и
 * независимо: индивидуальные и групповые занятия сравнивать между собой
 * можно, смешивать — нет.
 */
const blankInputs = (): UnitMarginInputs => ({
  periodMonth: lastClosedMonth(),
  individual: { price: 0, rate: DEFAULT_TEACHER_RATE, groupSize: 1 },
  group: { price: 0, rate: DEFAULT_TEACHER_RATE, groupSize: 4 },
  rates: { ...DEFAULT_RATES },
});

export default function UnitMarginReport() {
  const navigate = useNavigate();

  const [inputs, setInputs] = useState<UnitMarginInputs>(blankInputs);
  const [fact, setFact] = useState<UnitFact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFormula, setShowFormula] = useState(true);

  const [reports, setReports] = useState<SavedReport[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [toast, setToast] = useState('');

  /** Пресет ставок: их руководитель задаёт один раз, дальше они переносятся. */
  const [preset, setPreset] = useState<Partial<UnitMarginInputs> | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2600);
  };

  const patch = useCallback(
    (p: Partial<UnitMarginInputs>) => setInputs((prev) => ({ ...prev, ...p })),
    [],
  );

  useEffect(() => {
    document.title = 'Маржинальность урока';
    fetchUnitDefaults()
      .then((d) => {
        if (!d) return;
        setPreset(d);
        setInputs((prev) => ({
          ...prev,
          rates: { ...prev.rates, ...(d.rates || {}) },
          individual: { ...prev.individual, ...(d.individual || {}), price: prev.individual.price },
          group: { ...prev.group, ...(d.group || {}), price: prev.group.price },
        }));
      })
      .catch(() => {});
    fetchUnitReports().then(setReports).catch(() => {});
  }, []);

  /**
   * Подставляет в форму цены и наполняемость из факта месяца.
   * Ставки педагогов при этом не трогаем: они из пресета, а не из CRM.
   *
   * Наполняемость берём ОПЛАЧЕННУЮ (paid_units ÷ lessons). У индивидуальных
   * она бывает меньше единицы: если занятие провели, а списания не было
   * (отработка, уважительный пропуск) — расход есть, выручки нет.
   */
  const applyFact = useCallback((data: UnitFact, p: Partial<UnitMarginInputs> | null) => {
    setInputs((prev) => ({
      ...prev,
      individual: {
        ...prev.individual,
        rate: p?.individual?.rate ?? prev.individual.rate,
        price: data.individual.avg_price,
        groupSize: data.individual.avg_group_size || 1,
      },
      group: {
        ...prev.group,
        rate: p?.group?.rate ?? prev.group.rate,
        price: data.group.avg_price,
        groupSize: data.group.avg_group_size || prev.group.groupSize,
      },
    }));
  }, []);

  const load = useCallback(
    async (month: string, refresh = false) => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchUnitFact(month, refresh);
        setFact(data);
        applyFact(data, preset);
      } catch {
        setError('Не удалось получить данные CRM за месяц. Попробуйте обновить.');
        setFact(null);
      } finally {
        setLoading(false);
      }
    },
    [applyFact, preset],
  );

  useEffect(() => {
    load(inputs.periodMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs.periodMonth]);

  const result = useMemo(() => calcAll(inputs), [inputs]);

  const onSaveDefaults = async () => {
    setSavingDefaults(true);
    try {
      const defaults = {
        rates: inputs.rates,
        individual: { rate: inputs.individual.rate },
        group: { rate: inputs.group.rate },
      } as Partial<UnitMarginInputs>;
      await saveUnitDefaults(defaults);
      setPreset(defaults);
      flash('Ставки сохранены — подставятся в следующих месяцах');
    } catch {
      flash('Не удалось сохранить ставки');
    } finally {
      setSavingDefaults(false);
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await saveUnitReport({
        period_month: inputs.periodMonth,
        title: monthLabel(inputs.periodMonth),
        inputs,
        result,
        note,
      });
      setReports(await fetchUnitReports());
      setNote('');
      flash('Расчёт сохранён');
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (r: SavedReport) => {
    if (!window.confirm(`Удалить расчёт за ${monthLabel(r.period_month)}?`)) return;
    try {
      await deleteUnitReport(r.id);
      setReports((prev) => prev.filter((x) => x.id !== r.id));
      flash('Расчёт удалён');
    } catch {
      flash('Не удалось удалить');
    }
  };

  const better =
    result.individual.marginPercent >= result.group.marginPercent
      ? 'индивидуальные'
      : 'групповые';
  const diff = Math.abs(
    result.individual.marginPercent - result.group.marginPercent,
  ).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Шапка */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Маржинальность урока
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Юнит — одно проведённое занятие целиком. Индивидуальные и групповые
              считаем отдельно, по факту месяца из CRM
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <UnitMonthPicker
            month={inputs.periodMonth}
            onMonthChange={(m) => patch({ periodMonth: m })}
            fact={fact}
            loading={loading}
            error={error}
            onRefresh={() => load(inputs.periodMonth, true)}
          />

          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              <Icon name="Loader2" size={26} className="animate-spin mx-auto mb-2" />
              Считаем занятия за {monthLabel(inputs.periodMonth)}…
            </div>
          ) : (
            <>
              <UnitRatesForm
                inputs={inputs}
                fact={fact}
                onChange={patch}
                onResetFromFact={() => fact && applyFact(fact, preset)}
                onSaveDefaults={onSaveDefaults}
                savingDefaults={savingDefaults}
              />

              <div className="flex justify-end">
                <button
                  onClick={() => setShowFormula((v) => !v)}
                  className="text-xs px-2.5 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
                >
                  <Icon name={showFormula ? 'EyeOff' : 'Eye'} size={14} />
                  {showFormula ? 'Скрыть формулы' : 'Показать формулы'}
                </button>
              </div>

              {/* Два расчёта параллельно */}
              <div className="grid gap-4 lg:grid-cols-2">
                <UnitResultCard
                  result={result.individual}
                  fact={fact?.individual}
                  showFormula={showFormula}
                />
                <UnitResultCard
                  result={result.group}
                  fact={fact?.group}
                  showFormula={showFormula}
                />
              </div>

              {/* Вывод */}
              <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Lightbulb" size={18} className="text-amber-600" />
                  <h3 className="font-semibold text-gray-900">
                    Вывод за {monthLabel(inputs.periodMonth)}
                  </h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Индивидуальное занятие: выручка{' '}
                  {fmtMoney2(result.individual.revenue)}, маржа{' '}
                  <b>{fmtMoney2(result.individual.margin)}</b> (
                  {fmtPercent(result.individual.marginPercent)}). Групповое занятие
                  при наполняемости {result.group.clientsPerLesson} чел.: выручка{' '}
                  {fmtMoney2(result.group.revenue)}, маржа{' '}
                  <b>{fmtMoney2(result.group.margin)}</b> (
                  {fmtPercent(result.group.marginPercent)}). Выгоднее{' '}
                  <b>{better}</b> занятия — разрыв {diff} п.п.
                </p>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Юнит — одно проведённое занятие целиком. Выручка группового
                  занятия складывается из оплат всех пришедших детей, а ставка
                  педагога платится один раз независимо от их числа. Маржинальность
                  — доля выручки, остающаяся после переменных расходов: зарплаты
                  с взносами и отпускными и комиссии эквайринга. Постоянные расходы
                  школы сюда не входят — они покрываются уже из этой маржи.
                </p>
              </div>

              {/* Педагоги */}
              {fact && (
                <UnitTeachersTable teachers={fact.teachers} inputs={inputs} />
              )}

              {/* Сохранение */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <label className="block text-xs text-gray-500 mb-1">Комментарий</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="что проверяли, какие допущения"
                  className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="mt-3 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
                >
                  <Icon
                    name={saving ? 'Loader2' : 'Save'}
                    size={17}
                    className={saving ? 'animate-spin' : ''}
                  />
                  Сохранить расчёт месяца
                </button>
                <p className="text-xs text-gray-400 mt-2">
                  Сохранённый расчёт фиксирует цифры этого месяца — по ним потом
                  строится динамика.
                </p>
              </div>

              {/* История */}
              {reports.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-900">
                    Сохранённые расчёты ({reports.length})
                  </div>
                  <div className="divide-y divide-gray-100">
                    {reports.map((r) => (
                      <div
                        key={r.id}
                        className="px-5 py-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900">
                            {monthLabel(r.period_month)}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            инд. {fmtPercent(r.result?.individual?.marginPercent ?? 0)} ·
                            гр. {fmtPercent(r.result?.group?.marginPercent ?? 0)}
                            {r.note ? ` · ${r.note}` : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => patch({ periodMonth: r.period_month })}
                            className="text-xs px-2.5 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                          >
                            Открыть месяц
                          </button>
                          <button
                            onClick={() => onDelete(r)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Icon name="Trash2" size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}