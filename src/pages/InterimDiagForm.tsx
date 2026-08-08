import { useState } from 'react';
import Icon from '@/components/ui/icon';
import IncompleteSectionsDialog, {
  IncompleteSection,
} from '@/components/diag/IncompleteSectionsDialog';
import {
  checkInterimCompleteness,
  interimMissingBySection,
} from '@/components/interimDiag/checkCompleteness';
import SectionHighlight from '@/components/diag/SectionHighlight';
import RestoreDraftDialog from '@/components/diag/RestoreDraftDialog';
import DraftStatus from '@/components/diag/DraftStatus';
import { useFormDraft } from '@/hooks/useFormDraft';
import type { InterimDraft } from '@/components/interimDiag/draft';
import { isEmptyInterim } from '@/components/interimDiag/draft';
import { useEditReport } from '@/hooks/useEditReport';
import EditModeBanner from '@/components/diag/EditModeBanner';
import Footer from '@/components/Footer';
import DiagFormNavigation from '@/components/diag/DiagFormNavigation';
import InterimPersonalDataSection, {
  InterimPersonalData,
  InterimStudent,
} from '@/components/interimDiag/InterimPersonalDataSection';
import InterimImpairedProcessesSection from '@/components/interimDiag/InterimImpairedProcessesSection';
import InterimPrimaryConclusionSection from '@/components/interimDiag/InterimPrimaryConclusionSection';
import InterimReadingWritingSection from '@/components/interimDiag/InterimReadingWritingSection';
import InterimRecommendationsSection, {
  InterimRecommendationsData,
} from '@/components/interimDiag/InterimRecommendationsSection';
import PastDiagnosticsModal from '@/components/interimDiag/PastDiagnosticsModal';
import { buildPrimaryConclusion } from '@/components/interimDiag/primaryConclusion';
import {
  computeImpairedFromPrimary,
  computeBaselineLevels,
  EMPTY_IMPAIRED_STATE,
  ImpairedProcessKey,
  ImpairedProcessesState,
  ProcessLevel,
  ProcessLevelsState,
} from '@/components/interimDiag/impairedProcesses';
import {
  DysgraphicErrorItem,
  EMPTY_RW_STATE,
  ReadingWritingBaseline,
  ReadingWritingState,
  baselineFromPrimary,
  collectPrimaryErrorTypes,
  collectPrimaryOrthographicTypes,
  collectPrimaryReadingErrors,
  errorQualityHint,
} from '@/components/interimDiag/readingWriting';

export default function InterimDiagForm() {
  const [personal, setPersonal] = useState<InterimPersonalData>({
    childName: '',
    birthDate: '',
    age: '',
    grade: '',
    examDate: new Date().toISOString().split('T')[0],
  });

  const [impaired, setImpaired] = useState<ImpairedProcessesState>({ ...EMPTY_IMPAIRED_STATE });
  const [baseline, setBaseline] = useState<ProcessLevelsState>({});
  const [levels, setLevels] = useState<ProcessLevelsState>({});
  const [primaryData, setPrimaryData] = useState<InterimStudent['primary']>(undefined);
  const [autoFilled, setAutoFilled] = useState(false);
  const [primaryConclusion, setPrimaryConclusion] = useState('');
  const [studentSelected, setStudentSelected] = useState(false);
  const [history, setHistory] = useState<InterimStudent['history']>([]);
  const [primaryDate, setPrimaryDate] = useState<string | null>(null);
  // Дата текущей диагностики берётся из формы — логопед может её изменить
  const todayDate = personal.examDate || new Date().toISOString().split('T')[0];

  const [primarySamples, setPrimarySamples] = useState<string[]>([]);
  const [interimSamples, setInterimSamples] = useState<string[]>([]);
  const [interimSamplesDate, setInterimSamplesDate] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [pastOpen, setPastOpen] = useState(false);

  const [rwBaseline, setRwBaseline] = useState<ReadingWritingBaseline>({
    readingSpeed: '',
    readingComprehension: '',
    dictationWords: '',
    dysgraphicErrors: '',
    dysorthographicErrors: '',
    totalErrors: '',
    readingChar: '',
  });
  const [rw, setRw] = useState<ReadingWritingState>({ ...EMPTY_RW_STATE });

  const [recommendations, setRecommendations] = useState<InterimRecommendationsData>({
    teacherRecommendations: '',
    parentRecommendations: '',
    logopedist: '',
  });
  const patchRecommendations = (patch: Partial<InterimRecommendationsData>) =>
    setRecommendations((prev) => ({ ...prev, ...patch }));

  const patchPersonal = (patch: Partial<InterimPersonalData>) =>
    setPersonal((prev) => ({ ...prev, ...patch }));

  const handleSelectStudent = (student: InterimStudent) => {
    const nextImpaired = computeImpairedFromPrimary(student.primary);
    const nextBaseline = computeBaselineLevels(student.primary, nextImpaired);
    const hist = student.history || [];
    const lastEntry = hist.length > 0 ? hist[hist.length - 1] : null;

    setImpaired(nextImpaired);
    setBaseline(nextBaseline);
    // По умолчанию «стало» = последний известный замер (из истории), иначе = «было»
    const startLevels: ProcessLevelsState = { ...nextBaseline };
    if (lastEntry?.levels) {
      Object.keys(startLevels).forEach((k) => {
        const v = lastEntry.levels[k];
        if (v) startLevels[k as ImpairedProcessKey] = v as ProcessLevel;
      });
    }
    setLevels(startLevels);
    setPrimaryData(student.primary);
    setAutoFilled(true);
    setPrimaryConclusion(buildPrimaryConclusion(student.primary));
    setStudentSelected(true);
    setHistory(hist);
    setPrimaryDate(student.examDate);
    const rwBase = baselineFromPrimary(student.primary);
    setRwBaseline(rwBase);
    // Характер чтения по умолчанию = последний известный замер, иначе = из первичной
    const startReadingChar =
      (lastEntry?.readingChar && lastEntry.readingChar.trim()) || rwBase.readingChar || '';
    setRw({
      ...EMPTY_RW_STATE,
      readingChar: startReadingChar,
      readingErrorTypes: collectPrimaryReadingErrors(student.primary),
      errorTypes: collectPrimaryErrorTypes(student.primary),
      orthoErrorTypes: collectPrimaryOrthographicTypes(student.primary),
    });

    // Загружаем фото диктанта первичной и последней промежуточной (отдельный лёгкий запрос)
    setPrimarySamples([]);
    setInterimSamples([]);
    setInterimSamplesDate(null);
    fetch(
      `https://functions.poehali.dev/df42e72a-8b2b-4d65-80ee-9bac49fe7782?name=${encodeURIComponent(student.name)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d?.success) {
          setPrimarySamples(Array.isArray(d.primary) ? d.primary : []);
          setInterimSamples(Array.isArray(d.interim) ? d.interim : []);
          setInterimSamplesDate(d.interimDate || null);
        }
      })
      .catch(() => {});
  };

  // Прошлые диагностики можно вносить любому ребёнку — достаточно указать ФИО.
  // Выбор из списка не обязателен: у части детей диагностики шли не в этой форме.
  const openPastDiagnostics = () => {
    if (!personal.childName.trim()) {
      alert('Сначала укажите ФИО ребёнка в разделе «Персональные данные».');
      return;
    }
    setPastOpen(true);
  };

  // Перечитываем историю прошлых замеров после правок в модалке,
  // чтобы цепочки динамики сразу показали актуальные значения
  const reloadHistory = () => {
    if (!personal.childName.trim()) return;
    fetch('https://functions.poehali.dev/ed7f6726-88a1-4ecb-b063-ed890e8bd5cd')
      .then((r) => r.json())
      .then((d) => {
        const list: InterimStudent[] = d?.students || [];
        const found = list.find(
          (s) => s.name.trim().toLowerCase() === personal.childName.trim().toLowerCase(),
        );
        if (!found) return;
        const hist = found.history || [];
        setHistory(hist);

        // Первичную могли внести или отредактировать только что —
        // пересобираем всё, что от неё зависит: нарушенные процессы,
        // уровни «было», заключение первичной и показатели чтения/письма
        if (found.primary) {
          const nextImpaired = computeImpairedFromPrimary(found.primary);
          const nextBaseline = computeBaselineLevels(found.primary, nextImpaired);
          setPrimaryData(found.primary);
          setImpaired(nextImpaired);
          setBaseline(nextBaseline);
          setPrimaryConclusion(buildPrimaryConclusion(found.primary));
          setRwBaseline(baselineFromPrimary(found.primary));
          setPrimaryDate(found.examDate);
          setAutoFilled(true);
          setStudentSelected(true);

          const last = hist.length > 0 ? hist[hist.length - 1] : null;

          // Дата рождения и класс могли быть внесены только что
          setPersonal((prev) => ({
            ...prev,
            birthDate: prev.birthDate || found.birthDate || '',
            grade: prev.grade || found.grade || '',
          }));

          // Списки типов ошибок пересобираем из первичной, сохраняя пометки
          // логопеда: вычеркнутые «преодолённые» и добавленные вручную
          const mergeErrors = (
            fresh: DysgraphicErrorItem[],
            prev: DysgraphicErrorItem[],
          ): DysgraphicErrorItem[] => {
            const marks = new Map(prev.map((p) => [p.label.toLowerCase(), p]));
            const merged = fresh.map((f) => {
              const old = marks.get(f.label.toLowerCase());
              return old ? { ...f, struck: old.struck } : f;
            });
            const freshLabels = new Set(fresh.map((f) => f.label.toLowerCase()));
            const manual = prev.filter((p) => p.added && !freshLabels.has(p.label.toLowerCase()));
            return [...merged, ...manual];
          };

          setRw((prev) => ({
            ...prev,
            readingErrorTypes: mergeErrors(
              collectPrimaryReadingErrors(found.primary),
              prev.readingErrorTypes || [],
            ),
            errorTypes: mergeErrors(
              collectPrimaryErrorTypes(found.primary),
              prev.errorTypes || [],
            ),
            orthoErrorTypes: mergeErrors(
              collectPrimaryOrthographicTypes(found.primary),
              prev.orthoErrorTypes || [],
            ),
            // Характер чтения подставляем, только если логопед его ещё не выбрал
            readingChar:
              prev.readingChar ||
              (last?.readingChar || '').trim() ||
              baselineFromPrimary(found.primary).readingChar ||
              '',
          }));

          // «Стало» подтягиваем из последнего замера, но НЕ затираем то,
          // что логопед уже успел выставить руками в этой форме
          setLevels((prev) => {
            const next: ProcessLevelsState = { ...nextBaseline, ...prev };
            if (last?.levels) {
              Object.keys(nextBaseline).forEach((k) => {
                const key = k as ImpairedProcessKey;
                if (!prev[key]) {
                  const v = last.levels[key];
                  if (v) next[key] = v as ProcessLevel;
                }
              });
            }
            return next;
          });
        }
      })
      .catch(() => {});
  };

  const patchRw = (patch: Partial<ReadingWritingState>) =>
    setRw((prev) => ({ ...prev, ...patch }));

  const rwHint = errorQualityHint(rwBaseline, rw);

  const handleImpairedChange = (key: ImpairedProcessKey, checked: boolean) => {
    setImpaired((prev) => ({ ...prev, [key]: checked }));
    if (checked) {
      // Дозаполняем «было» и «стало» для процесса, включённого вручную
      const single = computeBaselineLevels(primaryData, { ...EMPTY_IMPAIRED_STATE, [key]: true });
      const lvl = single[key] || 'не соответствует возрастной норме';
      setBaseline((prev) => ({ ...prev, [key]: prev[key] || lvl }));
      setLevels((prev) => ({ ...prev, [key]: prev[key] || lvl }));
    }
  };

  const handleLevelChange = (key: ImpairedProcessKey, level: ProcessLevel) =>
    setLevels((prev) => ({ ...prev, [key]: level }));

  /* Правка сохранённой промежуточной: форма открыта из админки по ?edit=ID.
     Раскладываем сохранённый снимок обратно по разделам формы. */
  const { editId, loading: loadingReport, isEditing } = useEditReport<Record<string, unknown>>(
    (fd) => {
      const g = <T,>(k: string, fallback: T): T => (fd[k] as T) ?? fallback;
      setPersonal({
        childName: g('childName', ''),
        birthDate: g('birthDate', ''),
        age: g('age', ''),
        grade: g('grade', ''),
        examDate: g('interimDate', new Date().toISOString().split('T')[0]),
      });
      setImpaired({ ...EMPTY_IMPAIRED_STATE, ...g('interimImpaired', {}) });
      setBaseline(g('interimBaseline', {}));
      setLevels(g('interimLevels', {}));
      setPrimaryConclusion(g('conclusion', ''));
      setHistory(g('interimHistory', []));
      setPrimaryDate(g('primaryDate', null));
      setRwBaseline((prev) => ({ ...prev, ...g('interimRwBaseline', {}) }));
      setRw((prev) => ({ ...prev, ...g('interimReadingWriting', {}) }));
      setRecommendations({
        teacherRecommendations: g('teacherRecommendations', ''),
        parentRecommendations: g('parentRecommendations', ''),
        logopedist: g('logopedist', ''),
      });
      setStudentSelected(true);
    },
  );

  /* Черновик промежуточной: собираем все разделы формы в один снимок,
     чтобы данные пережили закрытие вкладки или обновление страницы. */
  const draftData: InterimDraft = {
    personal,
    impaired,
    baseline,
    levels,
    primaryConclusion,
    studentSelected,
    history: history || [],
    primaryDate,
    primarySamples,
    interimSamples,
    interimSamplesDate,
    rwBaseline,
    rw,
    recommendations,
    autoFilled,
  };

  const {
    draft,
    savedAt: draftSavedAt,
    restore: restoreDraft,
    discard: discardDraft,
    finish: finishDraft,
  } = useFormDraft<InterimDraft>({
    formId: 'interim',
    data: draftData,
    childName: personal.childName,
    isEmpty: isEmptyInterim,
    disabled: isEditing,
  });

  const applyDraft = (d: InterimDraft) => {
    setPersonal(d.personal);
    setImpaired(d.impaired);
    setBaseline(d.baseline);
    setLevels(d.levels);
    setPrimaryConclusion(d.primaryConclusion);
    setStudentSelected(d.studentSelected);
    setHistory(d.history);
    setPrimaryDate(d.primaryDate);
    setPrimarySamples(d.primarySamples);
    setInterimSamples(d.interimSamples);
    setInterimSamplesDate(d.interimSamplesDate);
    setRwBaseline(d.rwBaseline);
    setRw(d.rw);
    setRecommendations(d.recommendations);
    setAutoFilled(d.autoFilled);
  };

  const [saving, setSaving] = useState(false);

  const [incomplete, setIncomplete] = useState<IncompleteSection[]>([]);
  // Подсветка включается после возврата из предупреждения
  const [showGaps, setShowGaps] = useState(false);
  // Пересчитываем на лету: подсветка гаснет по мере заполнения
  const gaps = showGaps
    ? interimMissingBySection(
        checkInterimCompleteness({ personal, impaired, levels, rw, recommendations }),
      )
    : undefined;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Выбор ученика из базы не обязателен — данные можно заполнить полностью вручную
    if (!personal.childName.trim()) {
      alert('Укажите ФИО ребёнка в разделе «Персональные данные».');
      return;
    }
    // Перед сохранением показываем незаполненные разделы
    const gaps = checkInterimCompleteness({ personal, impaired, levels, rw, recommendations });
    if (gaps.length > 0) {
      setIncomplete(gaps);
      return;
    }
    void saveReport();
  };

  const saveReport = async () => {
    setSaving(true);
    try {
      // Дата диагностики — из формы (по умолчанию сегодняшняя)
      const today = personal.examDate || new Date().toISOString().split('T')[0];
      // Снимок состояния промежуточной диагностики
      const formData = {
        childName: personal.childName,
        birthDate: personal.birthDate,
        age: personal.age,
        grade: personal.grade,
        // Текущие значения показателей — совместимые ключи для будущей цепочки
        readingSpeed: rw.readingSpeed,
        readingComprehension: rw.readingComprehension,
        dictationWords: rw.dictationWords,
        dysgraphicErrors: rw.dysgraphicErrors,
        dysorthographicErrors: rw.dysorthographicErrors,
        totalErrors: rw.totalErrors,
        interimReadingChar: rw.readingChar,
        conclusion: primaryConclusion,
        // Полный снимок разделов промежуточной
        interimImpaired: impaired,
        interimLevels: levels,
        interimBaseline: baseline,
        // Цепочка прошлых замеров, чтобы заключение показало
        // «первичная → прошлые промежуточные → сейчас»
        interimHistory: history || [],
        primaryDate,
        interimDate: today,
        interimReadingWriting: rw,
        interimRwBaseline: rwBaseline,
        teacherRecommendations: recommendations.teacherRecommendations,
        parentRecommendations: recommendations.parentRecommendations,
        logopedist: recommendations.logopedist,
      };

      const res = await fetch('https://functions.poehali.dev/7bc33dbc-e8a0-47b4-83cc-d792dc7e1696', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: personal.childName,
          student_age: parseInt(personal.age) || null,
          date_of_examination: today,
          therapist_name: recommendations.logopedist || 'Логопед',
          diag_type: 'interim',
          recommendations: [recommendations.teacherRecommendations, recommendations.parentRecommendations]
            .filter(Boolean)
            .join('\n'),
          report_content: 'Промежуточная диагностика',
          form_data: formData,
          ...(editId ? { report_id: editId } : {}),
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        if (saved?.id) {
          finishDraft();
          window.location.href = `/interim_diag/${saved.id}`;
          return;
        }
        alert('Промежуточная диагностика сохранена!');
      } else {
        alert('Не удалось сохранить. Попробуйте ещё раз.');
      }
    } catch {
      alert('Ошибка при сохранении. Попробуйте ещё раз.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <DiagFormNavigation />

      <main className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Изменение заключения' : 'Промежуточная диагностика'}
            </h1>
            <DraftStatus savedAt={draftSavedAt} />
          </div>

          <EditModeBanner active={isEditing} loading={loadingReport} />

          <form className="space-y-8" onSubmit={onSubmit}>
            <SectionHighlight anchor="interim-personal" missing={gaps?.["interim-personal"]}>
            <InterimPersonalDataSection
              data={personal}
              onChange={patchPersonal}
              onSelectStudent={handleSelectStudent}
            />
            </SectionHighlight>
            <InterimPrimaryConclusionSection
              conclusion={primaryConclusion}
              selected={studentSelected}
              hint={rwHint}
              onChange={setPrimaryConclusion}
            />
            <div className="flex flex-col items-start gap-2">
              <button
                type="button"
                onClick={openPastDiagnostics}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Icon name="History" size={16} className="text-gray-500" />
                Добавить/изменить результаты прошлых диагностик
              </button>
              <span className="text-xs text-gray-500">
                Если первичная или промежуточные диагностики проводились не в этой форме — внесите их
                показатели вручную.
              </span>
            </div>

            <SectionHighlight anchor="interim-processes" missing={gaps?.["interim-processes"]}>
            <InterimImpairedProcessesSection
              value={impaired}
              baseline={baseline}
              levels={levels}
              history={history || []}
              primaryDate={primaryDate}
              todayDate={todayDate}
              onChange={handleImpairedChange}
              onLevelChange={handleLevelChange}
              autoFilled={autoFilled}
            />
            </SectionHighlight>
            <SectionHighlight anchor="interim-rw" missing={gaps?.["interim-rw"]}>
            <InterimReadingWritingSection
              baseline={rwBaseline}
              value={rw}
              history={history || []}
              primaryDate={primaryDate}
              todayDate={todayDate}
              primarySamples={primarySamples}
              interimSamples={interimSamples}
              interimSamplesDate={interimSamplesDate}
              onImageClick={setLightbox}
              onChange={patchRw}
              selected={studentSelected}
            />
            </SectionHighlight>
            <SectionHighlight anchor="interim-recommendations" missing={gaps?.["interim-recommendations"]}>
            <InterimRecommendationsSection
              data={recommendations}
              onChange={patchRecommendations}
              examDate={personal.examDate}
              onExamDateChange={(date) => patchPersonal({ examDate: date })}
            />
            </SectionHighlight>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {saving
                  ? 'Сохранение…'
                  : isEditing
                    ? 'Сохранить изменения'
                    : 'Сохранить промежуточную диагностику'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <RestoreDraftDialog
        open={!!draft && !isEditing}
        savedAt={draft?.savedAt || ''}
        childName={draft?.childName || ''}
        onRestore={() => {
          const d = restoreDraft();
          if (d) applyDraft(d);
        }}
        onDiscard={discardDraft}
      />

      <IncompleteSectionsDialog
        open={incomplete.length > 0}
        sections={incomplete}
        onCancel={() => {
          setIncomplete([]);
          setShowGaps(true);
        }}
        onConfirm={() => {
          setIncomplete([]);
          void saveReport();
        }}
      />

      <Footer />

      {pastOpen && (
        <PastDiagnosticsModal
          studentName={personal.childName}
          onClose={() => setPastOpen(false)}
          onSaved={reloadHistory}
        />
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Просмотр"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}