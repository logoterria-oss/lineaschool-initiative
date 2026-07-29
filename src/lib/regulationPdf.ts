import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Сохраняет DOM-элемент (текст регламента) в PDF-файл и скачивает его на ПК.
export const saveElementToPdf = async (
  el: HTMLElement,
  fileName: string,
): Promise<void> => {
  // Рендерим копию контента в offscreen-контейнере фиксированной ширины,
  // чтобы браузер разложил её в нормальную высоту (без схлопывания flex/grid).
  const PAGE_PX = 794; // ширина A4 при 96 dpi

  const holder = document.createElement('div');
  holder.style.position = 'fixed';
  holder.style.left = '-10000px';
  holder.style.top = '0';
  holder.style.width = `${PAGE_PX}px`;
  holder.style.background = '#ffffff';
  holder.style.padding = '24px';
  holder.style.boxSizing = 'border-box';

  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.width = '100%';
  clone.style.maxWidth = 'none';
  clone.style.margin = '0';
  clone.style.boxShadow = 'none';
  clone.style.border = 'none';
  holder.appendChild(clone);
  document.body.appendChild(holder);

  try {
    // Ждём загрузку изображений внутри клона.
    const imgs = Array.from(holder.querySelectorAll('img'));
    await Promise.all(
      imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((res) => {
              img.onload = () => res(null);
              img.onerror = () => res(null);
            }),
      ),
    );

    const canvas = await html2canvas(holder, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    });

    if (!canvas.width || !canvas.height) {
      throw new Error('Не удалось отрисовать содержимое для PDF');
    }

    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    const imgData = canvas.toDataURL('image/png');

    let heightLeft = imgH;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
    heightLeft -= pageH;

    while (heightLeft > 0) {
      position -= pageH;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
      heightLeft -= pageH;
    }

    pdf.save(fileName);
  } finally {
    holder.remove();
  }
};
