import type { InterimDraft } from './draft';

/**
 * Преобразование между состоянием формы и снимком, который лежит в базе.
 * Держим это в одном месте: сохранение, правка и черновик должны
 * раскладывать одни и те же поля одинаково.
 */

/** Снимок промежуточной диагностики, как он хранится в form_data */
export function buildInterimFormData(
  draft: InterimDraft & { autoSummary?: string; autoHomework?: string },
  examDate: string,
) {
  const { personal, rw, rwBaseline, impaired, levels, baseline, recommendations } = draft;

  return {
    childName: personal.childName,
    birthDate: personal.birthDate,
    age: personal.age,
    grade: personal.grade,
    // Текущие значения показателей — совместимые ключи для цепочки динамики
    readingSpeed: rw.readingSpeed,
    readingComprehension: rw.readingComprehension,
    dictationWords: rw.dictationWords,
    dysgraphicErrors: rw.dysgraphicErrors,
    dysorthographicErrors: rw.dysorthographicErrors,
    totalErrors: rw.totalErrors,
    interimReadingChar: rw.readingChar,
    conclusion: draft.primaryConclusion,
    // Полный снимок разделов промежуточной
    interimImpaired: impaired,
    interimLevels: levels,
    interimBaseline: baseline,
    // Цепочка прошлых замеров: «первичная → прошлые промежуточные → сейчас»
    interimHistory: draft.history || [],
    primaryDate: draft.primaryDate,
    interimDate: examDate,
    interimReadingWriting: rw,
    interimRwBaseline: rwBaseline,
    teacherRecommendations: recommendations.teacherRecommendations,
    parentRecommendations: recommendations.parentRecommendations,
    logopedist: recommendations.logopedist,
    // Итоговый текст вывода — тот, что реально увидит читатель заключения
    interimSummary: draft.summaryEdited ? draft.summary : draft.autoSummary || '',
    // Отчёт о выполнении домашних заданий
    interimHomework: draft.homeworkEdited ? draft.homework || '' : draft.autoHomework || '',
  };
}

/** Тело запроса на сохранение (или обновление, если передан editId) */
export function buildInterimPayload(
  draft: InterimDraft & { autoSummary?: string; autoHomework?: string },
  examDate: string,
  editId: number | null,
) {
  const { personal, recommendations } = draft;

  return {
    student_name: personal.childName,
    student_age: parseInt(personal.age) || null,
    date_of_examination: examDate,
    therapist_name: recommendations.logopedist || 'Логопед',
    diag_type: 'interim',
    recommendations: [
      recommendations.teacherRecommendations,
      recommendations.parentRecommendations,
    ]
      .filter(Boolean)
      .join('\n'),
    report_content: 'Промежуточная диагностика',
    form_data: buildInterimFormData(draft, examDate),
    ...(editId ? { report_id: editId } : {}),
  };
}
