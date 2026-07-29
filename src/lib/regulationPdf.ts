import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Сохраняет DOM-элемент (текст регламента) в многостраничный PDF формата A4.
export const saveElementToPdf = async (
  el: HTMLElement,
  fileName: string,
): Promise<void> => {
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    windowWidth: el.scrollWidth,
  });

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const margin = 10;
  const imgW = pageW - margin * 2;
  const imgH = (canvas.height * imgW) / canvas.width;

  const imgData = canvas.toDataURL('image/jpeg', 0.92);

  let heightLeft = imgH;
  let position = margin;

  pdf.addImage(imgData, 'JPEG', margin, position, imgW, imgH);
  heightLeft -= pageH - margin * 2;

  while (heightLeft > 0) {
    position = margin - (imgH - heightLeft);
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', margin, position, imgW, imgH);
    heightLeft -= pageH - margin * 2;
  }

  pdf.save(fileName);
};
