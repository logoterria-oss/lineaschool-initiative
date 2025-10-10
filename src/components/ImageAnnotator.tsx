import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ImageAnnotatorProps {
  imageUrl: string;
  onSave: (annotatedImageDataUrl: string) => void;
}

type MarkerColor = 'green' | 'red';

const ImageAnnotator = ({ imageUrl, onSave }: ImageAnnotatorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [markerColor, setMarkerColor] = useState<MarkerColor>('green');
  const [markerSize, setMarkerSize] = useState(20);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const loadImage = async () => {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        const img = new Image();
        img.onload = () => {
          imageRef.current = img;
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            setImageLoaded(true);
          }
          
          URL.revokeObjectURL(objectUrl);
        };
        img.onerror = () => {
          console.error('Failed to load image');
          setImageLoaded(false);
        };
        img.src = objectUrl;
      } catch (error) {
        console.error('Error loading image:', error);
        setImageLoaded(false);
      }
    };

    loadImage();
  }, [imageUrl]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== 'mousedown') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.globalAlpha = 0.4;
    ctx.fillStyle = markerColor === 'green' ? '#22c55e' : '#ef4444';
    ctx.beginPath();
    ctx.arc(x, y, markerSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imageRef.current, 0, 0);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Маркер:</span>
          <Button
            size="sm"
            variant={markerColor === 'green' ? 'default' : 'outline'}
            onClick={() => setMarkerColor('green')}
            className={markerColor === 'green' ? 'bg-green-500 hover:bg-green-600' : ''}
          >
            <Icon name="Highlighter" className="mr-1" size={14} />
            Дисграфия
          </Button>
          <Button
            size="sm"
            variant={markerColor === 'red' ? 'default' : 'outline'}
            onClick={() => setMarkerColor('red')}
            className={markerColor === 'red' ? 'bg-red-500 hover:bg-red-600' : ''}
          >
            <Icon name="Highlighter" className="mr-1" size={14} />
            Дизорфография
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Размер:</span>
          <input
            type="range"
            min="10"
            max="40"
            value={markerSize}
            onChange={(e) => setMarkerSize(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-sm text-gray-600">{markerSize}px</span>
        </div>

        <div className="flex gap-2 ml-auto">
          <Button size="sm" variant="outline" onClick={clearCanvas}>
            <Icon name="RotateCcw" className="mr-1" size={14} />
            Очистить
          </Button>
          <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Icon name="Save" className="mr-1" size={14} />
            Сохранить разметку
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full h-auto cursor-crosshair"
          style={{ display: imageLoaded ? 'block' : 'none' }}
        />
        {!imageLoaded && (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Icon name="Info" className="text-blue-600 mt-0.5" size={16} />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Как размечать:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Зелёным выделяйте дисграфические ошибки (нарушения письма)</li>
              <li>Красным выделяйте дизорфографические ошибки (орфографические)</li>
              <li>Нажмите и ведите мышкой для выделения</li>
              <li>После разметки нажмите "Сохранить разметку"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageAnnotator;