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
  const markersCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [markerColor, setMarkerColor] = useState<MarkerColor>('green');
  const [markerSize, setMarkerSize] = useState(20);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [greenCount, setGreenCount] = useState(0);
  const [redCount, setRedCount] = useState(0);
  const [markers, setMarkers] = useState<Array<{x: number, y: number, size: number, color: 'green' | 'red'}>>([]);
  const [hoveredMarkerIndex, setHoveredMarkerIndex] = useState<number | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const markersCanvas = markersCanvasRef.current;
    if (!canvas || !markersCanvas) return;

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
          markersCanvas.width = img.width;
          markersCanvas.height = img.height;
          
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

  useEffect(() => {
    redrawMarkers();
  }, [markers, hoveredMarkerIndex, markerColor]);

  const redrawMarkers = () => {
    const markersCanvas = markersCanvasRef.current;
    if (!markersCanvas) return;
    
    const ctx = markersCanvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, markersCanvas.width, markersCanvas.height);
    
    markers.forEach((marker, index) => {
      const isHovered = hoveredMarkerIndex === index && markerColor === 'eraser';
      
      if (isHovered) {
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(marker.x, marker.y, marker.size + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      ctx.globalAlpha = isHovered ? 0.6 : 0.4;
      ctx.fillStyle = marker.color === 'green' ? '#22c55e' : '#ef4444';
      ctx.beginPath();
      ctx.arc(marker.x, marker.y, marker.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });
  };

  const saveToHistory = () => {
    const markersCanvas = markersCanvasRef.current;
    if (!markersCanvas) return;
    
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(markersCanvas.toDataURL());
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (markerColor !== 'eraser') {
      setHoveredMarkerIndex(null);
      return;
    }

    const markersCanvas = markersCanvasRef.current;
    if (!markersCanvas) return;

    const rect = markersCanvas.getBoundingClientRect();
    const scaleX = markersCanvas.width / rect.width;
    const scaleY = markersCanvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const hoveredIndex = markers.findIndex(marker => {
      const distance = Math.sqrt(Math.pow(marker.x - x, 2) + Math.pow(marker.y - y, 2));
      return distance <= marker.size;
    });

    setHoveredMarkerIndex(hoveredIndex !== -1 ? hoveredIndex : null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const markersCanvas = markersCanvasRef.current;
    if (!markersCanvas) return;

    const rect = markersCanvas.getBoundingClientRect();
    const scaleX = markersCanvas.width / rect.width;
    const scaleY = markersCanvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (markerColor === 'eraser') {
      const clickedMarkerIndex = markers.findIndex(marker => {
        const distance = Math.sqrt(Math.pow(marker.x - x, 2) + Math.pow(marker.y - y, 2));
        return distance <= marker.size;
      });
      
      if (clickedMarkerIndex !== -1) {
        const removedMarker = markers[clickedMarkerIndex];
        const newMarkers = markers.filter((_, index) => index !== clickedMarkerIndex);
        setMarkers(newMarkers);
        
        if (removedMarker.color === 'green') {
          setGreenCount(prev => Math.max(0, prev - 1));
        } else {
          setRedCount(prev => Math.max(0, prev - 1));
        }
        setHoveredMarkerIndex(null);
      }
    } else {
      const newMarker = {
        x,
        y,
        size: markerSize,
        color: markerColor as 'green' | 'red'
      };
      setMarkers(prev => [...prev, newMarker]);
      
      if (markerColor === 'green') {
        setGreenCount(prev => prev + 1);
      } else if (markerColor === 'red') {
        setRedCount(prev => prev + 1);
      }
    }
    
    saveToHistory();
  };

  const undo = () => {
    if (historyStep > 0) {
      const markersCanvas = markersCanvasRef.current;
      if (!markersCanvas) return;
      
      const ctx = markersCanvas.getContext('2d');
      if (!ctx) return;
      
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, markersCanvas.width, markersCanvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[newStep];
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const markersCanvas = markersCanvasRef.current;
      if (!markersCanvas) return;
      
      const ctx = markersCanvas.getContext('2d');
      if (!ctx) return;
      
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, markersCanvas.width, markersCanvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[newStep];
    }
  };

  const clearCanvas = () => {
    setMarkers([]);
    setGreenCount(0);
    setRedCount(0);
    saveToHistory();
  };

  const handleSave = () => {
    if (markers.length === 0) {
      if (!confirm('Вы не сделали ни одной разметки. Продолжить сохранение?')) {
        return;
      }
    }
    setShowSaveConfirm(true);
  };

  const confirmSave = () => {
    const canvas = canvasRef.current;
    const markersCanvas = markersCanvasRef.current;
    if (!canvas || !markersCanvas) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (tempCtx) {
      tempCtx.drawImage(canvas, 0, 0);
      tempCtx.drawImage(markersCanvas, 0, 0);
      const dataUrl = tempCanvas.toDataURL('image/png');
      onSave(dataUrl);
    }
    setShowSaveConfirm(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-green-50 to-red-50 border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium text-gray-700">Дисграфия:</span>
            <span className="text-2xl font-bold text-green-600">{greenCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-sm font-medium text-gray-700">Дизорфография:</span>
            <span className="text-2xl font-bold text-red-600">{redCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="Circle" className="text-gray-400" size={16} />
            <span className="text-sm font-medium text-gray-700">Всего:</span>
            <span className="text-2xl font-bold text-gray-700">{greenCount + redCount}</span>
          </div>
        </div>
      </div>
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
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-300">
          {showSaveConfirm ? (
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Icon name="AlertTriangle" className="text-yellow-600 mt-0.5" size={20} />
                  <div className="flex-1">
                    <p className="font-semibold text-yellow-900">Подтверждение сохранения</p>
                    <p className="text-sm text-yellow-800 mt-1">
                      Найдено ошибок: {greenCount + redCount} (дисграфия: {greenCount}, дизорфография: {redCount})
                    </p>
                    <p className="text-sm text-yellow-800 mt-1">
                      После сохранения редактор закроется. Продолжить?
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={confirmSave} 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                  size="lg"
                >
                  <Icon name="Check" className="mr-2" size={18} />
                  Да, сохранить
                </Button>
                <Button 
                  onClick={() => setShowSaveConfirm(false)} 
                  variant="outline"
                  className="flex-1 py-3"
                  size="lg"
                >
                  <Icon name="X" className="mr-2" size={18} />
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              onClick={handleSave} 
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
              size="lg"
            >
              <Icon name="Save" className="mr-2" size={18} />
              Сохранить разметку
            </Button>
          )}
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Icon name="Info" className="text-blue-600 mt-0.5" size={16} />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Как размечать:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Зелёным выделяйте дисграфические ошибки (нарушения письма)</li>
              <li>Красным выделяйте дизорфографические ошибки (орфографические)</li>
              <li>Кликайте по ошибкам для их выделения</li>
              <li>Используйте ластик для удаления отметок</li>
              <li>После разметки нажмите "Сохранить разметку"</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white min-h-[200px] relative">
        <canvas
          ref={canvasRef}
          className="w-full h-auto absolute top-0 left-0"
          style={{ display: imageLoaded ? 'block' : 'none' }}
        />
        <canvas
          ref={markersCanvasRef}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredMarkerIndex(null)}
          className="w-full h-auto cursor-crosshair relative"
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