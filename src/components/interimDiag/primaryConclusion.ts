import { InterimPrimaryData } from './InterimPersonalDataSection';

// Форматирование связной речи (перенос логики из ConclusionLogic)
function formatConnectedSpeech(connectedSpeech: string[]): string {
  if (!connectedSpeech || connectedSpeech.length === 0 || connectedSpeech.includes('норма')) {
    return '';
  }
  if (!connectedSpeech.includes('нарушена')) {
    return '';
  }

  const parts: string[] = [];

  if (connectedSpeech.includes('бедность активного словаря')) {
    const vocabularyParts: string[] = [];
    if (!connectedSpeech.includes('номинативная функция сохранна')) {
      vocabularyParts.push('Объем активного словаря не соответствует возрастной норме');
      const paraphasiaTypes: string[] = [];
      if (connectedSpeech.includes('вербальные парафазии')) paraphasiaTypes.push('вербальные парафазии');
      if (connectedSpeech.includes('латеральные парафазии')) paraphasiaTypes.push('латеральные парафазии');
      if (connectedSpeech.includes('вербальные и латеральные парафазии'))
        paraphasiaTypes.push('вербальные и латеральные парафазии');
      if (paraphasiaTypes.length > 0) vocabularyParts.push(`наблюдаются ${paraphasiaTypes.join(', ')}`);
    }
    if (vocabularyParts.length > 0) parts.push(vocabularyParts.join(', '));
  }

  const storyViolations: string[] = [];
  if (connectedSpeech.includes('смысловая неадекватность')) storyViolations.push('нарушение логики передачи замысла');
  if (connectedSpeech.includes('пропуск отдельных смысловых звеньев и/или связующих элементов'))
    storyViolations.push('пропуск смысловых звеньев и связующих элементов');
  if (connectedSpeech.includes('неоднократные необоснованные повторы слов и предложений'))
    storyViolations.push('неоднократные необоснованные повторы');
  if (connectedSpeech.includes('малая длина синтагм'))
    storyViolations.push(
      'малая длина синтагм, которая указывает на синтагматические трудности, т.е. функциональную недостаточность передних отделов коры',
    );
  if (connectedSpeech.includes('малая длина текста'))
    storyViolations.push(
      'малая длина текста, которая свидетельствует о трудностях смыслового программирования и грамматического структурирования',
    );
  if (connectedSpeech.includes('смысловая неточность')) storyViolations.push('смысловая неточность');

  if (storyViolations.length > 0) {
    parts.push(`При составлении рассказа по серии сюжетных картинок наблюдается ${storyViolations.join(', ')}`);
  }

  return parts.length > 0 ? `Связная речь: нарушена. ${parts.join('. ')}` : '';
}

/**
 * Собирает текст логопедического заключения из данных первичной диагностики.
 * Логика повторяет generateConclusion в src/components/DiagForm/ConclusionLogic.tsx.
 */
export function buildPrimaryConclusion(p: InterimPrimaryData | undefined): string {
  if (!p) return '';

  const conclusionParts: string[] = [];

  const connectedSpeechText = formatConnectedSpeech(p.connectedSpeech || []);
  if (connectedSpeechText) conclusionParts.push(connectedSpeechText);

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
