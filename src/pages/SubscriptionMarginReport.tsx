import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import MarginSetup from '@/components/margin/MarginSetup';
import MarginDirectForm from '@/components/margin/MarginDirectForm';
import MarginIndirectForm from '@/components/margin/MarginIndirectForm';
import MarginResultView from '@/components/margin/MarginResultView';
import MarginHistory from '@/components/margin/MarginHistory';
import {
  CrmMonth, CrmTariff, MarginReport,
  deleteReport, fetchCrmMonth, fetchDefaults, fetchReports, fetchTariffs,
  saveDefaults, saveReport, updateReport,
} from '@/lib/marginApi';
import {
  DEFAULT_INDIRECT, DEFAULT_RATES, MarginInputs, TeacherLine,
  calcMargin, lastClosedMonth, monthLabel,
} from '@/lib/marginModel';

/** Пустая заготовка отчёта — с ней страница открывается в первый раз. */
const blankInputs = (): MarginInputs => ({
  tariffKey: '',
  tariffName: '',
  periodMonth: lastClosedMonth(),
  tariffPrice: 0,
  tariffLessons: 0,
  tariffMonths: 1,
  teachers: [],
  ...DEFAULT_RATES,
  indirect: DEFAULT_INDIRECT.map((l) => ({ ...l })),
  schoolRevenue: 0,
  schoolStudentLessons: 0,
});

/**
 * Состав недели по абонементу. Сначала пробуем разобрать название
 * («2гр.+1инд.»), а если в нём состава нет — берём фактическое соотношение
 * групповых и индивидуальных занятий из CRM за месяц.
 */
const buildTeachers = (tariff: CrmTariff | undefined, fact: CrmMonth['tariffs'][string] | undefined): TeacherLine[] => {
  const lines: TeacherLine[] = [];
  const groupTeacher = fact?.teachers.find((t) => t.group > 0);
  const indTeacher = fact?.teachers.find((t) => t.individual > 0);
  const avgSize = fact?.avg_group_size && fact.avg_group_size > 0 ? fact.avg_group_size : 4;

  let group = tariff?.composition?.group ?? null;
  let individual = tariff?.composition?.individual ?? null;

  if (group === null || individual === null) {
    const perWeek = tariff?.per_week ?? fact?.per_week ?? 0;
    const g = fact?.group_student_lessons ?? 0;
    const i = fact?.individual_student_lessons ?? 0;
    if (perWeek > 0 && g + i > 0) {
      // Раскладываем неделю в той же пропорции, что и факт месяца.
      group = Math.round((g / (g + i)) * perWeek);
      individual = perWeek - group;
    } else {
      group = perWeek;
      individual = 0;
    }
  }

  if (group > 0) {
    lines.push({
      id: 'g',
      name: groupTeacher?.name || '',
      form: 'group',
      rate: 650,
      perWeek: group,
      groupSize: groupTeacher?.avg_group_size || avgSize,
    });
  }
  if (individual > 0) {
    lines.push({
      id: 'i',
      name: indTeacher?.name || '',
      form: 'individual',
      rate: 650,
      perWeek: individual,
      groupSize: 1,
    });
  }
  return lines;
};

export default function SubscriptionMarginReport() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [tariffs, setTariffs] = useState<CrmTariff[]>([]);
  const [crm, setCrm] = useState<CrmMonth | null>(null);
  const [crmLoading, setCrmLoading] = useState(false);
  const [crmError, setCrmError] = useState('');

  const [inputs, setInputs] = useState<MarginInputs>(blankInputs);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const [reports, setReports] = useState<MarginReport[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [toast, setToast] = useState('');
  const [tab, setTab] = useState<'calc' | 'history'>('calc');

  const patch = useCallback(
    (p: Partial<MarginInputs>) => setInputs((prev) => ({ ...prev, ...p })),
    [],
  );

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2600);
  };

  // Первая загрузка: справочник абонементов, сохранённые отчёты и пресет.
  useEffect(() => {
    document.title = 'Маржинальность абонементов';
    fetchTariffs().then(setTariffs).catch(() => setCrmError('Не удалось загрузить абонементы из CRM'));
    fetchReports().then(setReports).catch(() => {});
    fetchDefaults()
      .then((d) => {
        if (d) setInputs((prev) => ({ ...prev, ...d }));
      })
      .catch(() => {});
  }, []);

  // Данные месяца из CRM.
  const loadCrm = useCallback(
    async (month: string, refresh = false) => {
      setCrmLoading(true);
      setCrmError('');
      try {
        const data = await fetchCrmMonth(month, refresh);
        setCrm(data);
        // Масштаб школы обновляем всегда: по нему делятся косвенные расходы.
        setInputs((prev) => ({
          ...prev,
          schoolRevenue: data.total_revenue,
          schoolStudentLessons: data.total_student_lessons,
        }));
        return data;
      } catch {
        setCrmError('Не удалось получить данные CRM за месяц. Попробуйте обновить.');
        return null;
      } finally {
        setCrmLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadCrm(inputs.periodMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs.periodMonth]);

  // Выбор абонемента: подставляем цену, состав недели и педагогов из факта.
  const onTariffChange = useCallback(
    (key: string) => {
      const t = tariffs.find((x) => String(x.id) === key);
      const fact = crm?.tariffs?.[key];
      setInputs((prev) => ({
        ...prev,
        tariffKey: key,
        tariffName: t?.name || '',
        tariffPrice: t?.price || 0,
        tariffLessons: t?.lessons_count || 0,
        tariffMonths: t?.months || 1,
        teachers: buildTeachers(t, fact),
      }));
      setTitle((prev) =>
        prev || !t ? prev : `${t.short_name || t.name} · ${monthLabel(inputs.periodMonth)}`,
      );
    },
    [tariffs, crm, inputs.periodMonth],
  );

  // Ссылка вида ?tariff=39 открывает сразу заполненный расчёт — удобно
  // пересылать конкретный абонемент коллеге. Ждём, пока приедут справочник
  // и факт месяца, иначе подставлять будет нечего.
  const deepLink = params.get('tariff');
  useEffect(() => {
    if (!deepLink || inputs.tariffKey || !tariffs.length || !crm) return;
    onTariffChange(deepLink);
  }, [deepLink, inputs.tariffKey, tariffs, crm, onTariffChange]);

  const result = useMemo(() => calcMargin(inputs), [inputs]);

  const fact = inputs.tariffKey ? crm?.tariffs?.[inputs.tariffKey] : undefined;
  const teacherNames = useMemo(() => {
    const set = new Set<string>();
    Object.values(crm?.tariffs || {}).forEach((t) =>
      t.teachers.forEach((x) => set.add(x.name)),
    );
    return [...set].sort();
  }, [crm]);

  const payload = () => ({
    title: title || inputs.tariffName,
    tariff_key: inputs.tariffKey,
    tariff_name: inputs.tariffName,
    period_month: inputs.periodMonth,
    inputs,
    result,
    note,
  });

  const onSave = async () => {
    if (!inputs.tariffKey) {
      flash('Сначала выберите абонемент');
      return;
    }
    setSaving(true);
    try {
      const saved = editingId
        ? await updateReport(editingId, payload())
        : await saveReport(payload());
      setEditingId(saved.id);
      setReports(await fetchReports());
      flash(editingId ? 'Отчёт обновлён' : 'Отчёт сохранён');
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const onSaveAsNew = async () => {
    if (!inputs.tariffKey) return;
    setSaving(true);
    try {
      const saved = await saveReport(payload());
      setEditingId(saved.id);
      setReports(await fetchReports());
      flash('Создана новая версия отчёта');
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const onOpenReport = (r: MarginReport) => {
    setInputs({ ...blankInputs(), ...r.inputs });
    setTitle(r.title);
    setNote(r.note);
    setEditingId(r.id);
    setTab('calc');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onDeleteReport = async (r: MarginReport) => {
    if (!window.confirm(`Удалить отчёт «${r.title || r.tariff_name}»?`)) return;
    try {
      await deleteReport(r.id);
      setReports((prev) => prev.filter((x) => x.id !== r.id));
      if (editingId === r.id) setEditingId(null);
      flash('Отчёт удалён');
    } catch {
      flash('Не удалось удалить');
    }
  };

  const onNewReport = () => {
    setInputs((prev) => ({ ...blankInputs(), periodMonth: prev.periodMonth }));
    setTitle('');
    setNote('');
    setEditingId(null);
  };

  const onSaveDefaults = async () => {
    setSavingDefaults(true);
    try {
      await saveDefaults({
        indirect: inputs.indirect,
        sfrPercent: inputs.sfrPercent,
        acquiringPercent: inputs.acquiringPercent,
        vacationDivisor: inputs.vacationDivisor,
        usnPercent: inputs.usnPercent,
        usnReduceLimitPercent: inputs.usnReduceLimitPercent,
      });
      flash('Пресет расходов сохранён');
    } catch {
      flash('Не удалось сохранить пресет');
    } finally {
      setSavingDefaults(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Шапка */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Маржинальность абонементов
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Сколько зарабатывает школа на одном ребёнке по каждому абонементу
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editingId && (
              <span className="text-xs bg-amber-100 text-amber-800 rounded-full px-2.5 py-1 font-medium">
                редактируется №{editingId}
              </span>
            )}
            <button
              onClick={onNewReport}
              className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-white"
            >
              Новый расчёт
            </button>
          </div>
        </div>

        {/* Вкладки */}
        <div className="flex gap-2 mb-5">
          {([
            { id: 'calc', label: 'Расчёт', icon: 'Calculator' },
            { id: 'history', label: `Сохранённые (${reports.length})`, icon: 'History' },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-1.5 ${
                tab === t.id
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
              }`}
            >
              <Icon name={t.icon} size={15} />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'history' ? (
          <MarginHistory
            reports={reports}
            currentId={editingId}
            onOpen={onOpenReport}
            onDelete={onDeleteReport}
          />
        ) : (
          <div className="space-y-4">
            <MarginSetup
              tariffs={tariffs}
              tariffKey={inputs.tariffKey}
              onTariffChange={onTariffChange}
              month={inputs.periodMonth}
              onMonthChange={(m) => patch({ periodMonth: m })}
              crm={crm}
              crmLoading={crmLoading}
              crmError={crmError}
              onRefreshCrm={() => loadCrm(inputs.periodMonth, true)}
            />

            {fact && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900/90">
                <div className="flex items-center gap-2 font-semibold mb-1.5">
                  <Icon name="Database" size={16} className="text-blue-600" />
                  Факт CRM по этому абонементу за {monthLabel(inputs.periodMonth)}
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1 text-[13px]">
                  <div>Учеников: <b>{fact.students}</b></div>
                  <div>
                    Занятий: <b>{fact.group_student_lessons}</b> гр. +{' '}
                    <b>{fact.individual_student_lessons}</b> инд.
                  </div>
                  <div>Средняя группа: <b>{fact.avg_group_size} чел.</b></div>
                  <div>Списано денег: <b>{Math.round(fact.revenue).toLocaleString('ru-RU')} ₽</b></div>
                </div>
                {fact.teachers.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-blue-200/60 text-[13px]">
                    Педагоги:{' '}
                    {fact.teachers
                      .map((t) => `${t.name} (${t.group} гр. / ${t.individual} инд.)`)
                      .join(', ')}
                  </div>
                )}
                {/* Форму не перезаписываем сами: руководитель мог поправить
                    ставки руками. Подставляем факт только по кнопке. */}
                <button
                  onClick={() => onTariffChange(inputs.tariffKey)}
                  className="mt-2.5 text-xs px-2.5 py-1.5 rounded-md border border-blue-300 text-blue-700 hover:bg-blue-100/60"
                >
                  Подставить эти данные в форму
                </button>
              </div>
            )}

            {inputs.tariffKey ? (
              <>
                <MarginDirectForm inputs={inputs} onChange={patch} teacherNames={teacherNames} />
                <MarginIndirectForm
                  inputs={inputs}
                  onChange={patch}
                  share={result.indirectShare}
                  onSaveDefaults={onSaveDefaults}
                  savingDefaults={savingDefaults}
                />
                <MarginResultView result={result} />

                {/* Сохранение */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Название отчёта</label>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="например: 3 ур/нед (3 мес.) — сентябрь"
                        className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Комментарий</label>
                      <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="что проверяли, какие допущения"
                        className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={onSave}
                      disabled={saving}
                      className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
                    >
                      <Icon name={saving ? 'Loader2' : 'Save'} size={17} className={saving ? 'animate-spin' : ''} />
                      {editingId ? 'Сохранить изменения' : 'Сохранить отчёт'}
                    </button>
                    {editingId && (
                      <button
                        onClick={onSaveAsNew}
                        disabled={saving}
                        className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                      >
                        Сохранить как новый
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Отчёт хранится в базе вместе с исходными данными — его можно
                    открыть и пересчитать в любой момент, а по сохранениям
                    строится динамика.
                  </p>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-400">
                <Icon name="MousePointerClick" size={32} className="mx-auto mb-3" />
                <p className="text-sm">
                  Выберите абонемент — форма заполнится данными CRM за выбранный месяц.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}