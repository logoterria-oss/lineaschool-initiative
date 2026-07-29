// Сохранение регламента в PDF через системный диалог печати браузера
// (в диалоге выбирается «Сохранить как PDF»). Это надёжно работает со
// сложной вёрсткой, ссылками, эмодзи и многостраничным текстом.
export const saveElementToPdf = async (
  el: HTMLElement,
  title: string,
): Promise<void> => {
  // Собираем стили страницы, чтобы регламент выглядел так же, как на экране.
  const headStyles = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]'),
  )
    .map((node) => node.outerHTML)
    .join('\n');

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    throw new Error('Не удалось подготовить документ для печати');
  }

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<title>${title}</title>
${headStyles}
<style>
  @page { size: A4; margin: 12mm; }
  html, body { background: #fff; }
  body { padding: 0; margin: 0; }
  .pdf-wrap { max-width: 800px; margin: 0 auto; }
  a { color: #1d4ed8; text-decoration: underline; }
</style>
</head>
<body>
  <div class="pdf-wrap">${el.outerHTML}</div>
</body>
</html>`);
  doc.close();

  // Ждём, пока подгрузятся шрифты и изображения внутри iframe.
  await new Promise((resolve) => {
    if (iframe.contentWindow?.document.readyState === 'complete') resolve(null);
    else iframe.onload = () => resolve(null);
  });
  await new Promise((r) => setTimeout(r, 300));

  const win = iframe.contentWindow;
  if (win) {
    win.focus();
    win.print();
  }

  // Убираем iframe после закрытия диалога печати.
  setTimeout(() => iframe.remove(), 1000);
};
