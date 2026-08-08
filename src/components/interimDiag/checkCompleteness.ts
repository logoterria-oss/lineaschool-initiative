import type { IncompleteSection } from '@/components/diag/IncompleteSectionsDialog';
import type { ImpairedProcessesState, ProcessLevel } from './impairedProcesses';
import { IMPAIRED_GROUPS } from './impairedProcesses';
import type { ReadingWritingState } from './readingWriting';

interface PersonalData {
  childName: string;
  birthDate: string;
  grade: string;
  examDate: string;
}

interface RecommendationsData {
  teacherRecommendations: string;
  parentRecommendations: string;
  logopedist: string;
}

const empty = (v: string | undefined) => (v || '').trim() === '';

/**
 * Проверка заполненности промежуточной диагностики.
 * Сохранение не блокируем — просто показываем, что осталось пустым.
 */
export function checkInterimCompleteness(args: {
  personal: PersonalData;
  impaired: ImpairedProcessesState;
  levels: Record<string, ProcessLevel | ''>;
  rw: ReadingWritingState;
  recommendations: RecommendationsData;
}): IncompleteSection[] {
  const { personal, impaired, levels, rw, recommendations } = args;
  const result: IncompleteSection[] = [];

  const personalGaps: string[] = [];
  if (empty(personal.childName)) personalGaps.push('ФИО ребёнка');
  if (empty(personal.birthDate)) personalGaps.push('Дата рождения');
  if (empty(personal.grade)) personalGaps.push('Класс');
  if (personalGaps.length > 0) {
    result.push({
      title: 'Персональные данные',
      fields: personalGaps,
      anchor: 'interim-personal',
    });
  }

  // Нарушенные процессы: хотя бы один должен быть отмечен,
  // а у отмеченных — выставлен текущий уровень
  const checked = Object.keys(impaired).filter((k) => impaired[k as keyof ImpairedProcessesState]);
  const processGaps: string[] = [];
  if (checked.length === 0) {
    processGaps.push('Не отмечен ни один нарушенный процесс');
  } else {
    const labelOf = (key: string) => {
      for (const g of IMPAIRED_GROUPS) {
        const item = g.items.find((i) => i.key === key);
        if (item) return item.label;
      }
      return key;
    };
    checked
      .filter((k) => !levels[k])
      .forEach((k) => processGaps.push(`${labelOf(k)} — не указан текущий уровень`));
  }
  if (processGaps.length > 0) {
    result.push({
      title: 'Нарушенные речевые процессы',
      fields: processGaps,
      anchor: 'interim-processes',
    });
  }

  const rwGaps: string[] = [];
  if (empty(rw.readingChar)) rwGaps.push('Характер чтения');
  if (empty(rw.readingSpeed)) rwGaps.push('Скорость чтения');
  if (empty(rw.readingComprehension)) rwGaps.push('Понимание прочитанного');
  if (empty(rw.dictationWords)) rwGaps.push('Количество слов в работе');
  if (empty(rw.dysgraphicErrors)) rwGaps.push('Количество дисграфических ошибок');
  if (empty(rw.dysorthographicErrors)) rwGaps.push('Количество орфографических ошибок');
  if (empty(rw.totalErrors)) rwGaps.push('Ошибок всего');
  if (rwGaps.length > 0) {
    result.push({ title: 'Чтение и письмо', fields: rwGaps, anchor: 'interim-rw' });
  }

  const recGaps: string[] = [];
  if (empty(recommendations.teacherRecommendations)) recGaps.push('Рекомендации педагогам');
  if (empty(recommendations.parentRecommendations)) recGaps.push('Рекомендации родителям');
  if (empty(personal.examDate)) recGaps.push('Дата диагностики');
  if (empty(recommendations.logopedist)) recGaps.push('Логопед-диагност');
  if (recGaps.length > 0) {
    result.push({ title: 'Рекомендации', fields: recGaps, anchor: 'interim-recommendations' });
  }

  return result;
}

/** Пропущенные пункты в виде «якорь раздела → список полей» для подсветки */
export function interimMissingBySection(
  sections: IncompleteSection[],
): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  sections.forEach((s) => {
    if (s.anchor) map[s.anchor] = s.fields;
  });
  return map;
}
