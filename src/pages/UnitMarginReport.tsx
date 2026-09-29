import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import UnitMonthPicker from '@/components/unitMargin/UnitMonthPicker';
import UnitRatesForm from '@/components/unitMargin/UnitRatesForm';
import UnitResultCard from '@/components/unitMargin/UnitResultCard';
import UnitTeachersTable from '@/components/unitMargin/UnitTeachersTable';
import UnitMonthTotalCard from '@/components/unitMargin/UnitMonthTotalCard';
import UnitPlanCard from '@/components/unitMargin/UnitPlanCard';
import UnitWeightedRateCard from '@/components/unitMargin/UnitWeightedRateCard';
import UnitReportHeader from '@/components/unitMargin/UnitReportHeader';
import UnitConclusionCard from '@/components/unitMargin/UnitConclusionCard';
import UnitSaveBox from '@/components/unitMargin/UnitSaveBox';
import UnitReportsHistory from '@/components/unitMargin/UnitReportsHistory';
import {
  UnitFact, UnitMarginReport as SavedReport, UnitPlanMonth,
  deleteUnitReport, fetchUnitDefaults, fetchUnitFact, fetchUnitPlan,
  fetchUnitReports, saveUnitDefaults, saveUnitReport,
} from '@/lib/unitMarginApi';
import { fetchSupervisions, type Supervision } from '@/lib/supervisionsApi';
import { fetchTeacherRates, type TeacherRate } from '@/lib/teacherRatesApi';
import { periodLabelForMonth, weightedRate } from '@/lib/unitTeacherRates';
import {
  DEFAULT_RATES, DEFAULT_TEACHER_RATE, UnitMarginInputs,
  calcAll, calcMonthTotals, lastClosedMonth, monthLabel,
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

  /** План по занятиям, уже стоящим в расписании CRM на будущие месяцы. */
  const [plan, setPlan] = useState<UnitPlanMonth[]>([]);
  const [planLoading, setPlanLoading] = useState(false);

  /** Супервизии и сохранённые ставки — источник точных ставок педагогов. */
  const [supervisions, setSupervisions] = useState<Supervision[]>([]);
  const [teacherRates, setTeacherRates] = useState<TeacherRate[]>([]);
  /** Считать по реальным ставкам каждого педагога, а не по одной общей. */
  const [useRealRates, setUseRealRates] = useState(true);

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
    // Ставки педагогов: без них расчёт просто останется на общей ставке
    fetchSupervisions().then(setSupervisions).catch(() => {});
    fetchTeacherRates().then(setTeacherRates).catch(() => {});
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

  /**
   * Средневзвешенные ставки педагогов за месяц отчёта.
   * Ставка каждого × число его занятий ÷ все занятия формы. Считаем всегда,
   * даже когда галочка выключена: карточка показывает, что изменится.
   */
  const weighted = useMemo(() => {
    const teachers = fact?.teachers ?? [];
    return {
      individual: weightedRate(
        teachers, 'individual', inputs.periodMonth,
        supervisions, teacherRates, inputs.individual.rate,
      ),
      group: weightedRate(
        teachers, 'group', inputs.periodMonth,
        supervisions, teacherRates, inputs.group.rate,
      ),
    };
  }, [fact, inputs.periodMonth, inputs.individual.rate, inputs.group.rate,
      supervisions, teacherRates]);

  /**
   * Вход расчёта с учётом точных ставок. Подменяем ТОЛЬКО ставку педагога:
   * цены и наполняемость остаются фактом CRM. Если супервизий нет и ни одна
   * ставка не найдена — оставляем общую, иначе расчёт «поплыл» бы на пустом.
   */
  const effectiveInputs = useMemo<UnitMarginInputs>(() => {
    if (!useRealRates) return inputs;
    return {
      ...inputs,
      individual: {
        ...inputs.individual,
        rate: weighted.individual.lessons > 0
          ? weighted.individual.rate
          : inputs.individual.rate,
      },
      group: {
        ...inputs.group,
        rate: weighted.group.lessons > 0 ? weighted.group.rate : inputs.group.rate,
      },
    };
  }, [inputs, weighted, useRealRates]);

  const result = useMemo(() => calcAll(effectiveInputs), [effectiveInputs]);

  /**
   * Итог выбранного месяца: экономику одного занятия умножаем на реальное
   * число проведённых занятий каждой формы. Диагностики в факте уже
   * исключены, поэтому берём lessons как есть.
   */
  const monthTotals = useMemo(
    () =>
      fact
        ? calcMonthTotals(result, fact.individual.lessons, fact.group.lessons)
        : null,
    [result, fact],
  );

  const loadPlan = useCallback(async (refresh = false) => {
    setPlanLoading(true);
    try {
      setPlan(await fetchUnitPlan(3, refresh));
    } catch {
      setPlan([]);
    } finally {
      setPlanLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

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
        // Сохраняем ПРИМЕНЁННЫЕ ставки: иначе по сохранённому расчёту нельзя
        // было бы понять, из каких цифр получился результат
        inputs: effectiveInputs,
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
        <UnitReportHeader onBack={() => navigate(-1)} />

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
                appliedRates={
                  useRealRates && (weighted.individual.lessons > 0 || weighted.group.lessons > 0)
                    ? {
                        individual: effectiveInputs.individual.rate,
                        group: effectiveInputs.group.rate,
                      }
                    : null
                }
              />

              {/* Точные ставки педагогов из супервизий */}
              {fact && (
                <UnitWeightedRateCard
                  individual={weighted.individual}
                  group={weighted.group}
                  periodLabel={periodLabelForMonth(inputs.periodMonth)}
                  flatIndividual={inputs.individual.rate}
                  flatGroup={inputs.group.rate}
                  applied={useRealRates}
                  onToggle={setUseRealRates}
                />
              )}

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

              {/* Средняя маржинальность по всем урокам месяца */}
              {monthTotals && (
                <UnitMonthTotalCard
                  totals={monthTotals}
                  month={inputs.periodMonth}
                />
              )}

              {/* План на будущие месяцы по расписанию CRM */}
              <UnitPlanCard
                plan={plan}
                result={result}
                baseMonth={inputs.periodMonth}
                loading={planLoading}
                onRefresh={() => loadPlan(true)}
              />

              {/* Вывод */}
              <UnitConclusionCard
                result={result}
                month={inputs.periodMonth}
                better={better}
                diff={diff}
              />

              {/* Педагоги: у каждого своя ставка, если считаем по реальным */}
              {fact && (
                <UnitTeachersTable
                  teachers={fact.teachers}
                  inputs={effectiveInputs}
                  rateRows={useRealRates ? [...weighted.individual.rows, ...weighted.group.rows] : []}
                />
              )}

              {/* Сохранение */}
              <UnitSaveBox
                note={note}
                onNoteChange={setNote}
                onSave={onSave}
                saving={saving}
              />

              {/* История */}
              <UnitReportsHistory
                reports={reports}
                onOpenMonth={(m) => patch({ periodMonth: m })}
                onDelete={onDelete}
              />
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
