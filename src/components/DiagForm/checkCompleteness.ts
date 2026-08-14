import type { DiagFormData } from '@/types/diagFormData';
import type { IncompleteSection } from '@/components/diag/IncompleteSectionsDialog';

/** Пустое значение: пустая строка, пробелы или пустой список */
function isEmpty(v: unknown): boolean {
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'string') return v.trim() === '';
  return v === null || v === undefined;
}

type Rule = { key: keyof DiagFormData; label: string };

/**
 * Разделы первичной диагностики и их ключевые поля.
 * Проверяем только то, что реально нужно в заключении:
 * служебные и уточняющие поля («…Custom», «…Other») пропускаем —
 * они заполняются лишь при выборе варианта «другое».
 */
const SECTIONS: { title: string; anchor: string; rules: Rule[] }[] = [
  {
    title: 'Персональные данные',
    anchor: 'section-personal',
    rules: [
      { key: 'childName', label: 'ФИО ребёнка' },
      { key: 'birthDate', label: 'Дата рождения' },
      { key: 'grade', label: 'Класс' },
      { key: 'complaints', label: 'Жалобы' },
    ],
  },
  {
    title: 'Анамнестические данные',
    anchor: 'section-anamnestics',
    rules: [
      { key: 'prenatalDevelopment', label: 'Пренатальное развитие' },
      { key: 'earlyDevelopment', label: 'Раннее развитие' },
      { key: 'neurologicalDisorders', label: 'Неврологические нарушения' },
      { key: 'hearingVisionDisorders', label: 'Нарушения слуха и зрения' },
      { key: 'speechEnvironment', label: 'Речевая среда' },
      { key: 'dominantHand', label: 'Ведущая рука' },
    ],
  },
  {
    title: 'Импрессивная речь',
    anchor: 'section-impressive',
    rules: [
      { key: 'wordUnderstanding', label: 'Понимание слов' },
      { key: 'complexConstructions', label: 'Понимание сложных конструкций' },
      { key: 'phonematicPerception', label: 'Фонематическое восприятие' },
    ],
  },
  {
    title: 'Экспрессивная речь',
    anchor: 'section-expressive',
    // Словообразование и номинативная функция отдельными полями в форме
    // не заполняются — они выводятся из связной речи, поэтому не требуем
    rules: [
      { key: 'motorRealization', label: 'Моторная реализация' },
      { key: 'grammaticalStructure', label: 'Грамматический строй' },
      { key: 'connectedSpeech', label: 'Связная речь' },
    ],
  },
  {
    title: 'Письменная речь',
    anchor: 'section-written',
    rules: [
      { key: 'languageAnalysis', label: 'Языковой анализ и синтез' },
      { key: 'readingSkill', label: 'Навык чтения' },
      { key: 'readingSpeed', label: 'Скорость чтения' },
      { key: 'readingComprehension', label: 'Понимание прочитанного' },
      { key: 'dictationWords', label: 'Количество слов в работе' },
      { key: 'dysgraphicErrors', label: 'Дисграфические ошибки' },
      { key: 'dysorthographicErrors', label: 'Орфографические ошибки' },
      { key: 'totalErrors', label: 'Ошибок всего' },
    ],
  },
  {
    title: 'Заключение',
    anchor: 'section-conclusion',
    // Достаточно любой отмеченной группы — проверка ниже, в checkPrimaryCompleteness
    rules: [{ key: 'speechDisorders', label: 'Нарушения речи' }],
  },
  {
    title: 'Рекомендации',
    anchor: 'section-final',
    rules: [
      { key: 'recommendations', label: 'Рекомендации' },
      { key: 'workDirections', label: 'Направления работы' },
      { key: 'diagnosisDate', label: 'Дата диагностики' },
      { key: 'logopedist', label: 'Логопед-диагност' },
    ],
  },
];

/** Список незаполненных разделов первичной диагностики */
export function checkPrimaryCompleteness(data: DiagFormData): IncompleteSection[] {
  const result: IncompleteSection[] = [];

  SECTIONS.forEach((section) => {
    if (section.anchor === 'section-conclusion') {
      // «Норма развития» снимает требование: при норме нарушения не указываются.
      // Также достаточно отметок в любой из групп заключения — виды дислексии,
      // дисграфии или синдромы тоже считаются заполненным заключением.
      const filled =
        data.normaDevelopment ||
        !isEmpty(data.speechDisorders) ||
        !isEmpty(data.dyslexiaTypes) ||
        !isEmpty(data.dysgraphiaTypes) ||
        !isEmpty(data.brainSyndromes);
      if (filled) return;
      result.push({ title: section.title, fields: ['Нарушения речи'], anchor: section.anchor });
      return;
    }

    const fields = section.rules.filter((r) => isEmpty(data[r.key])).map((r) => r.label);
    if (fields.length > 0) {
      result.push({ title: section.title, fields, anchor: section.anchor });
    }
  });

  return result;
}

/** Пропущенные пункты в виде «якорь раздела → список полей» для подсветки */
export function missingBySection(sections: IncompleteSection[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  sections.forEach((s) => {
    if (s.anchor) map[s.anchor] = s.fields;
  });
  return map;
}