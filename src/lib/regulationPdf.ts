import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PAGE_PX = 794; // ширина A4 при 96 dpi

// Готовит offscreen-контейнер фиксированной ширины и кладёт в него узел.
const mountOffscreen = (node: HTMLElement): HTMLElement => {
  const holder = document.createElement('div');
  holder.style.position = 'fixed';
  holder.style.left = '-10000px';
  holder.style.top = '0';
  holder.style.width = `${PAGE_PX}px`;
  holder.style.background = '#ffffff';
  holder.style.boxSizing = 'border-box';
  holder.appendChild(node);
  document.body.appendChild(holder);
  return holder;
};

const waitImages = async (root: HTMLElement) => {
  const imgs = Array.from(root.querySelectorAll('img'));
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
};

// Разбиваем контент на «неразрывные» блоки: заголовки секций и отдельные
// параграфы / списки / карточки. Так абзацы не разрезаются между страницами.
const collectBlocks = (content: HTMLElement): HTMLElement[] => {
  const blocks: HTMLElement[] = [];
  const sections = Array.from(content.children) as HTMLElement[];
  const src = sections.length ? sections : [content];

  for (const section of src) {
    const kids = Array.from(section.children) as HTMLElement[];
    if (kids.length === 0) {
      blocks.push(section);
      continue;
    }
    for (const kid of kids) blocks.push(kid);
  }
  return blocks;
};

// Рендерит один DOM-блок в картинку нужной ширины (в мм) и её высоту.
const renderBlock = async (
  block: HTMLElement,
  imgWmm: number,
): Promise<{ data: string; hMM: number }> => {
  const wrap = document.createElement('div');
  wrap.style.width = '100%';
  wrap.style.background = '#ffffff';
  const clone = block.cloneNode(true) as HTMLElement;
  clone.style.margin = '0';
  wrap.appendChild(clone);

  const holder = mountOffscreen(wrap);
  try {
    await waitImages(holder);
    const canvas = await html2canvas(holder, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    });
    const data = canvas.toDataURL('image/png');
    const hMM = (canvas.height * imgWmm) / canvas.width;
    return { data, hMM };
  } finally {
    holder.remove();
  }
};

// Сохраняет регламент в PDF-файл: с титульным заголовком и без разрезания абзацев.
export const saveElementToPdf = async (
  el: HTMLElement,
  fileName: string,
  title: string,
): Promise<void> => {
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const imgW = pageW - margin * 2;
  const usableH = pageH - margin;

  // Титульный заголовок как отдельный блок.
  const titleEl = document.createElement('div');
  titleEl.style.padding = '0 0 8px';
  titleEl.innerHTML = `<h1 style="font-size:22px;font-weight:800;color:#111827;line-height:1.3;margin:0 0 16px;">${title}</h1>`;

  const blocks = [titleEl, ...collectBlocks(el)];

  let y = margin;
  for (const block of blocks) {
    const { data, hMM } = await renderBlock(block, imgW);
    if (hMM <= 0) continue;

    // Блок целиком не влезает в остаток страницы — переносим на новую.
    if (y + hMM > usableH && y > margin) {
      pdf.addPage();
      y = margin;
    }

    // Блок выше целой страницы (крупная картинка) — режем его как изображение.
    if (hMM > pageH - margin * 2) {
      let heightLeft = hMM;
      let pos = y;
      pdf.addImage(data, 'PNG', margin, pos, imgW, hMM);
      heightLeft -= pageH - y - margin;
      while (heightLeft > 0) {
        pdf.addPage();
        pos = margin - (hMM - heightLeft);
        pdf.addImage(data, 'PNG', margin, pos, imgW, hMM);
        heightLeft -= pageH - margin * 2;
      }
      y = margin;
      pdf.addPage();
      continue;
    }

    pdf.addImage(data, 'PNG', margin, y, imgW, hMM);
    y += hMM + 3;
  }

  pdf.save(fileName);
};
