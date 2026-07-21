import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  file: File;
  onCancel: () => void;
  onDone: (blob: Blob) => void;
  uploading?: boolean;
}

const OUTPUT = 512; // размер итогового квадрата (px)
const BOX = 260; // размер области предпросмотра (px)

const AvatarCropper = ({ file, onCancel, onDone, uploading }: Props) => {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [src, setSrc] = useState('');
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [error, setError] = useState('');
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const image = new Image();
      image.onload = () => {
        const m = BOX / Math.min(image.width, image.height);
        setImg(image);
        setSrc(dataUrl);
        setMinScale(m);
        setScale(m);
        setOffset({ x: 0, y: 0 });
      };
      image.onerror = () => setError('Не удалось открыть изображение. Выберите другой файл.');
      image.src = dataUrl;
    };
    reader.onerror = () => setError('Не удалось прочитать файл. Выберите другой.');
    reader.readAsDataURL(file);
  }, [file]);

  // Ограничиваем сдвиг, чтобы картинка всегда покрывала круг.
  const clamp = (o: { x: number; y: number }, s: number) => {
    if (!img) return o;
    const w = img.width * s;
    const h = img.height * s;
    const maxX = Math.max(0, (w - BOX) / 2);
    const maxY = Math.max(0, (h - BOX) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, o.x)),
      y: Math.max(-maxY, Math.min(maxY, o.y)),
    };
  };

  const onScale = (s: number) => {
    setScale(s);
    setOffset((o) => clamp(o, s));
  };

  const startDrag = (cx: number, cy: number) => {
    drag.current = { x: cx, y: cy, ox: offset.x, oy: offset.y };
  };
  const moveDrag = (cx: number, cy: number) => {
    if (!drag.current) return;
    const nx = drag.current.ox + (cx - drag.current.x);
    const ny = drag.current.oy + (cy - drag.current.y);
    setOffset(clamp({ x: nx, y: ny }, scale));
  };
  const endDrag = () => { drag.current = null; };

  const handleSave = () => {
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const k = OUTPUT / BOX; // масштаб превью -> выход
    const dw = img.width * scale * k;
    const dh = img.height * scale * k;
    const dx = OUTPUT / 2 - dw / 2 + offset.x * k;
    const dy = OUTPUT / 2 - dh / 2 + offset.y * k;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, OUTPUT, OUTPUT);
    ctx.drawImage(img, dx, dy, dw, dh);
    canvas.toBlob(
      (blob) => { if (blob) onDone(blob); },
      'image/jpeg',
      0.92,
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4 text-center">Настройте фото</h3>

        {error ? (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        ) : (
          <>
            <div
              className="relative mx-auto rounded-full overflow-hidden bg-gray-100 touch-none select-none cursor-move"
              style={{ width: BOX, height: BOX }}
              onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
              onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
              onMouseUp={endDrag}
              onMouseLeave={endDrag}
              onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchMove={(e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchEnd={endDrag}
            >
              {img && (
                <img
                  src={src}
                  alt="Кадрирование"
                  draggable={false}
                  className="absolute top-1/2 left-1/2 max-w-none pointer-events-none"
                  style={{
                    width: img.width * scale,
                    height: img.height * scale,
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                  }}
                />
              )}
              <div className="absolute inset-0 rounded-full ring-2 ring-white/70 pointer-events-none" />
            </div>

            <div className="flex items-center gap-3 mt-4">
              <Icon name="ZoomOut" size={18} className="text-gray-400" />
              <input
                type="range"
                min={minScale}
                max={minScale * 4}
                step={0.001}
                value={scale}
                onChange={(e) => onScale(Number(e.target.value))}
                className="flex-1 accent-green-600"
              />
              <Icon name="ZoomIn" size={18} className="text-gray-400" />
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              Перетащите фото и настройте масштаб ползунком
            </p>
          </>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            disabled={uploading}
            className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-700 font-medium py-2.5 rounded-xl transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={uploading || !img || !!error}
            className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors inline-flex items-center justify-center gap-2"
          >
            {uploading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Check" size={16} />}
            {uploading ? 'Сохраняю…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarCropper;