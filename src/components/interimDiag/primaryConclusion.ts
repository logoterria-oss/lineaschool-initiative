import { InterimPrimaryData } from './InterimPersonalDataSection';

/**
 * Собирает текст логопедического заключения из данных первичной диагностики.
 * Логика повторяет generateConclusion в src/components/DiagForm/ConclusionLogic.tsx.
 */
export function buildPrimaryConclusion(p: InterimPrimaryData | undefined): string {
  if (!p) return '';

  const conclusionParts: string[] = [];

  if (Array.isArray(p.speechDisorders) && p.speechDisorders.length > 0) {
    conclusionParts.push(p.speechDisorders.join(', '));
  }
  if (Array.isArray(p.dyslexiaTypes) && p.dyslexiaTypes.length > 0) {
    conclusionParts.push(p.dyslexiaTypes.join(', '));
  }
  if (Array.isArray(p.dysgraphiaTypes) && p.dysgraphiaTypes.length > 0) {
    conclusionParts.push(p.dysgraphiaTypes.join(', '));
  }

  const brainSyndromesPart =
    Array.isArray(p.brainSyndromes) && p.brainSyndromes.length > 0 ? p.brainSyndromes.join(', ') : null;

  let diagnosis = conclusionParts.length > 0 ? conclusionParts.join(', ') : '';

  if (!diagnosis && !brainSyndromesPart) return '';

  if (!diagnosis) diagnosis = 'Нарушения речевого развития';

  if (brainSyndromesPart) {
    diagnosis = diagnosis + ' — ' + brainSyndromesPart;
  }

  diagnosis = diagnosis.charAt(0).toUpperCase() + diagnosis.slice(1) + '.';
  return diagnosis;
}