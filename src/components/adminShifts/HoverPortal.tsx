import { ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  /** Ячейка, рядом с которой показываем подсказку */
  anchor: DOMRect;
  children: ReactNode;
}

const GAP = 6;
const EDGE = 8;

/**
 * Подсказка поверх страницы. Сама находит свободное место:
 * если снизу не помещается — раскрывается вверх, если справа — сдвигается влево.
 * Рисуется отдельным слоем, поэтому её не обрезают рамки календаря.
 */
const HoverPortal = ({ anchor, children }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; maxHeight: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const place = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const below = vh - anchor.bottom - GAP - EDGE;
      const above = anchor.top - GAP - EDGE;
      // Разворачиваем вниз, если места хватает или снизу его больше, чем сверху
      const openDown = h <= below || below >= above;

      const maxHeight = Math.max(160, openDown ? below : above);
      const height = Math.min(h, maxHeight);
      const top = openDown ? anchor.bottom + GAP : Math.max(EDGE, anchor.top - GAP - height);
      const left = Math.min(Math.max(EDGE, anchor.left), Math.max(EDGE, vw - w - EDGE));

      setPos({ top, left, maxHeight });
    };

    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [anchor]);

  return createPortal(
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: pos?.top ?? anchor.bottom + GAP,
        left: pos?.left ?? anchor.left,
        maxHeight: pos?.maxHeight,
        // До первого замера прячем, чтобы подсказка не «прыгала»
        visibility: pos ? 'visible' : 'hidden',
        overflowY: 'auto',
        zIndex: 60,
      }}
      className="pointer-events-none hidden sm:block"
    >
      {children}
    </div>,
    document.body,
  );
};

export default HoverPortal;