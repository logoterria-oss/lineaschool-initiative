import { useState } from 'react';
import type { IncompleteSection } from '@/components/diag/IncompleteSectionsDialog';
import {
  checkInterimCompleteness,
  interimMissingBySection,
} from './checkCompleteness';
import { useFormDraft } from '@/hooks/useFormDraft';
import type { InterimDraft } from './draft';
import { isEmptyInterim } from './draft';
import { useEditReport } from '@/hooks/useEditReport';
import { buildInterimSummary } from '@/components/interimConclusion/buildSummary';
import { buildHomeworkReport } from '@/components/interimConclusion/buildHomework';
import { buildInterimPayload } from './interimFormData';
import type { useInterimState } from './useInterimState';
import { EMPTY_IMPAIRED_STATE } from './impairedProcesses';

type InterimState = ReturnType<typeof useInterimState>;

/**
 * Сохранение промежуточной диагностики: режим правки из админки,
 * черновик, проверка заполненности и отправка на сервер.
 */
export function useInterimSubmit(st: InterimState) {
  const {
    personal,
    setPersonal,
    impaired,
    setImpaired,
    baseline,
    setBaseline,
    levels,
    setLevels,
    setPrimaryConclusion,
    setStudentSelected,
    setHistory,
    setPrimaryDate,
    rwBaseline,
    setRwBaseline,
    rw,
    setRw,
    recommendations,
    setRecommendations,
    setSummary,
    setSummaryEdited,
    homeworkMarks,
    setHomework,
    setHomeworkEdited,
    draftData,
    applyDraft,
  } = st;

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
      // Тексты вывода и отчёта по ДЗ восстанавливаем как ручную правку:
      // иначе при повторном сохранении они пересобрались бы заново
      // и потеряли формулировки, которые логопед уже утвердил.
      const savedSummary = g('interimSummary', '');
      if (savedSummary) {
        setSummary(savedSummary);
        setSummaryEdited(true);
      }
      const savedHomework = g('interimHomework', '');
      if (savedHomework) {
        setHomework(savedHomework);
        setHomeworkEdited(true);
      }
      setStudentSelected(true);
    },
  );

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

  // Общий вывод собирается автоматически из данных выше
  const autoSummary = buildInterimSummary({
    impaired,
    baseline,
    levels,
    rwBaseline: { ...rwBaseline },
    rw: { ...rw },
  });

  // Отчёт по ДЗ — из отметок раздела «Контроль ДЗ»
  const autoHomework = buildHomeworkReport(homeworkMarks || [], personal.examDate);

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

  const saveReport = async () => {
    setSaving(true);
    try {
      // Дата диагностики — из формы (по умолчанию сегодняшняя)
      const today = personal.examDate || new Date().toISOString().split('T')[0];

      const res = await fetch('https://functions.poehali.dev/7bc33dbc-e8a0-47b4-83cc-d792dc7e1696', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildInterimPayload({ ...draftData, autoSummary, autoHomework }, today, editId)),
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

  return {
    editId,
    loadingReport,
    isEditing,
    draft,
    draftSavedAt,
    restoreDraft,
    discardDraft,
    applyDraft,
    autoSummary,
    autoHomework,
    saving,
    incomplete,
    setIncomplete,
    setShowGaps,
    gaps,
    onSubmit,
    saveReport,
  };
}