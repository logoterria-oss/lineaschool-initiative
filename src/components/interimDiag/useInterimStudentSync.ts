import { useEffect } from 'react';
import type { InterimStudent } from './InterimPersonalDataSection';
import type { useInterimState } from './useInterimState';
import { buildPrimaryConclusion } from './primaryConclusion';
import {
  computeImpairedFromPrimary,
  computeBaselineLevels,
  EMPTY_IMPAIRED_STATE,
  ImpairedProcessKey,
  ProcessLevel,
  ProcessLevelsState,
} from './impairedProcesses';
import {
  DysgraphicErrorItem,
  EMPTY_RW_STATE,
  baselineFromPrimary,
  collectPrimaryErrorTypes,
  collectPrimaryOrthographicTypes,
  collectPrimaryReadingErrors,
  errorQualityHint,
} from './readingWriting';

type InterimState = ReturnType<typeof useInterimState>;

/**
 * Синхронизация формы с данными ребёнка: выбор ученика из базы,
 * перечитывание истории после правок и ручное включение процессов.
 */
export function useInterimStudentSync(st: InterimState) {
  const {
    personal,
    setPersonal,
    setImpaired,
    setBaseline,
    setLevels,
    primaryData,
    setPrimaryData,
    setAutoFilled,
    setPrimaryConclusion,
    setStudentSelected,
    setHistory,
    setPrimaryDate,
    setPrimarySamples,
    setInterimSamples,
    setInterimSamplesDate,
    rwBaseline,
    setRwBaseline,
    rw,
    setRw,
    setHomeworkMarks,
    setHomeworkLoading,
  } = st;

  /**
   * Отметки выполнения ДЗ по ученику из раздела «Контроль ДЗ».
   * Запрос отдельный и лёгкий (только база, без обращения к CRM),
   * поэтому не тормозит остальное автозаполнение формы.
   */
  const loadHomework = (name: string) => {
    if (!name.trim()) {
      setHomeworkMarks([]);
      return;
    }
    setHomeworkLoading(true);
    fetch(
      `https://functions.poehali.dev/6d9e6094-fd18-47ec-b45f-ad3ee4ba7cc2?mode=hw_history&name=${encodeURIComponent(name)}`,
    )
      .then((r) => r.json())
      .then((d) => setHomeworkMarks(Array.isArray(d?.items) ? d.items : []))
      .catch(() => setHomeworkMarks([]))
      .finally(() => setHomeworkLoading(false));
  };

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

    // Отчёт по ДЗ не зависит от прошлых заключений — грузим по имени сразу
    loadHomework(student.name);

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

  // ФИО могли ввести руками, не выбирая из подсказок: тогда остальные
  // данные не подтянутся, а отчёт по ДЗ собрать всё равно можно —
  // он привязан только к имени. Ждём паузу в наборе, чтобы не дёргать
  // сервер на каждую букву.
  useEffect(() => {
    const name = personal.childName.trim();
    if (name.length < 4) {
      setHomeworkMarks([]);
      return;
    }
    const t = setTimeout(() => loadHomework(name), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personal.childName]);

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

  return {
    handleSelectStudent,
    reloadHistory,
    rwHint,
    handleImpairedChange,
    handleLevelChange,
  };
}