// Единая обработка эмодзи в ФИО из CRM.
// Эмодзи считаем частью имени и всегда переносим в конец строки,
// не влияя на перестановку слов «Имя Фамилия» → «Фамилия Имя».

// Регэксп эмодзи (смайлики, символы, флаги и модификаторы).
export const EMOJI_RE =
  /(?:\p{Extended_Pictographic}(?:\uFE0F|\u200D|\p{Emoji_Modifier})*)+/gu;

// Разбивает строку на текст (без эмодзи) и склеенные эмодзи.
export const splitEmoji = (raw: string): { text: string; emojis: string } => {
  const s = raw || '';
  const emojis = (s.match(EMOJI_RE) || []).join('');
  const text = s.replace(EMOJI_RE, '').replace(/\s+/g, ' ').trim();
  return { text, emojis };
};

// Приклеивает эмодзи в конец готового текста имени.
export const withEmoji = (text: string, emojis: string): string =>
  emojis ? `${text} ${emojis}`.trim() : text;
