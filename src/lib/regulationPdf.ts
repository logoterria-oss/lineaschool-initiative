import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Сохраняет DOM-элемент (текст регламента) в PDF-файл и скачивает его на ПК.
export const saveElementToPdf = async (
  el: HTMLElement,
  fileName: string,
): Promise<void> => {
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    scrollX: 0,
    scrollY: 0,
    width: el.scrollWidth,
    height: el.scrollHeight,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
  });

  if (!canvas.width || !canvas.height) {
    throw new Error('Не удалось отрисовать содержимое для PDF');
  }

  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const margin = 10;
  const imgW = pageW - margin * 2;
  const imgH = (canvas.height * imgW) / canvas.width;

  const imgData = canvas.toDataURL('image/png');

  const usableH = pageH - margin * 2;
  let heightLeft = imgH;
  let position = margin;

  pdf.addImage(imgData, 'PNG', margin, position, imgW, imgH);
  heightLeft -= usableH;

  while (heightLeft > 0) {
    position = margin - (imgH - heightLeft);
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', margin, position, imgW, imgH);
    heightLeft -= usableH;
  }

  pdf.save(fileName);
};