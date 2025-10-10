import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ImageAnnotatorProps {
  imageUrl: string;
  onSave: (annotatedImageDataUrl: string) => void;
}

type MarkerColor = 'green' | 'red' | 'eraser';

const ImageAnnotator = ({ imageUrl, onSave }: ImageAnnotatorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [markerColor, setMarkerColor] = useState<MarkerColor>('green');
  const [markerSize, setMarkerSize] = useState(20);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const loadImage = async () => {
      try {
        setImageLoaded(false);
        setLoadError(null);
        
        const proxyUrl = `https://functions.poehali.dev/4e7a1ed9-4e38-45c8-804c-decf67141ce5?url=${encodeURIComponent(imageUrl)}`;
        console.log('Loading image via proxy:', proxyUrl);
        
        const img = new Image();
        img.onload = () => {
          console.log('Image loaded successfully:', img.width, 'x', img.height);
          imageRef.current = img;
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            setImageLoaded(true);
            saveToHistory();
          }
        };
        img.onerror = (e) => {
          console.error('Failed to load image:', e);
          setLoadError('Не удалось загрузить изображение');
          setImageLoaded(false);
        };
        img.src = proxyUrl;
      } catch (error) {
        console.error('Error loading image:', error);
        setLoadError(`Ошибка: ${error}`);
        setImageLoaded(false);
      }
    };

    loadImage();
  }, [imageUrl]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(canvas.toDataURL());
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (markerColor === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, markerSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = markerColor === 'green' ? '#22c55e' : '#ef4444';
      ctx.beginPath();
      ctx.arc(x, y, markerSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
    
    saveToHistory();
  };

  const undo = () => {
    if (historyStep > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[newStep];
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[newStep];
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imageRef.current, 0, 0);
      saveToHistory();
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
      <div className="space-y-3">
        <div className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Инструмент:</span>
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
            <Button
              size="sm"
              variant={markerColor === 'eraser' ? 'default' : 'outline'}
              onClick={() => setMarkerColor('eraser')}
              className={markerColor === 'eraser' ? 'bg-gray-700 hover:bg-gray-800' : ''}
            >
              <Icon name="Eraser" className="mr-1" size={14} />
              Ластик
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
            <Button size="sm" variant="outline" onClick={undo} disabled={historyStep <= 0}>
              <Icon name="Undo2" className="mr-1" size={14} />
              Назад
            </Button>
            <Button size="sm" variant="outline" onClick={redo} disabled={historyStep >= history.length - 1}>
              <Icon name="Redo2" className="mr-1" size={14} />
              Вперёд
            </Button>
            <Button size="sm" variant="outline" onClick={clearCanvas}>
              <Icon name="RotateCcw" className="mr-1" size={14} />
              Очистить
            </Button>
            <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Icon name="Save" className="mr-1" size={14} />
              Сохранить
            </Button>
          </div>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white min-h-[200px]">
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          className="w-full h-auto cursor-crosshair"
          style={{ display: imageLoaded ? 'block' : 'none' }}
        />
        {!imageLoaded && !loadError && (
          <div className="flex flex-col items-center justify-center p-12 gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="text-sm text-gray-500">Загрузка изображения...</p>
          </div>
        )}
        {loadError && (
          <div className="flex flex-col items-center justify-center p-12 gap-2">
            <Icon name="AlertCircle" className="text-red-500" size={32} />
            <p className="text-sm text-red-600">{loadError}</p>
            <p className="text-xs text-gray-500">URL: {imageUrl}</p>
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