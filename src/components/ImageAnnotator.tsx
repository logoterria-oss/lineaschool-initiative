import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ImageAnnotatorProps {
  imageUrl: string;
  onSave: (annotatedImageDataUrl: string) => void;
}

type MarkerColor = 'green' | 'red' | 'underline' | 'eraser';

const ImageAnnotator = ({ imageUrl, onSave }: ImageAnnotatorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markersCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [underlineStart, setUnderlineStart] = useState<{x: number, y: number} | null>(null);
  const [markerColor, setMarkerColor] = useState<MarkerColor>('green');
  const [markerSize, setMarkerSize] = useState(20);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [history, setHistory] = useState<Array<{markers: Array<{x: number, y: number, size: number, color: 'green' | 'red'}>, underlines: Array<{x1: number, y1: number, x2: number, y2: number}>, greenCount: number, redCount: number}>>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [greenCount, setGreenCount] = useState(0);
  const [redCount, setRedCount] = useState(0);
  const [markers, setMarkers] = useState<Array<{x: number, y: number, size: number, color: 'green' | 'red'}>>([]);
  const [underlines, setUnderlines] = useState<Array<{x1: number, y1: number, x2: number, y2: number}>>([]);
  const [hoveredMarkerIndex, setHoveredMarkerIndex] = useState<number | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const storageKey = `annotator_${imageUrl}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setMarkers(data.markers || []);
        setUnderlines(data.underlines || []);
        setGreenCount(data.greenCount || 0);
        setRedCount(data.redCount || 0);
      } catch (e) {
        console.error('Failed to load saved markers:', e);
      }
    }
  }, [imageUrl]);

  useEffect(() => {
    if (markers.length > 0 || underlines.length > 0 || greenCount > 0 || redCount > 0) {
      localStorage.setItem(storageKey, JSON.stringify({
        markers,
        underlines,
        greenCount,
        redCount
      }));
    }
  }, [markers, underlines, greenCount, redCount, storageKey]);

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
        img.crossOrigin = 'anonymous';
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

  const redrawMarkers = () => {
    const markersCanvas = markersCanvasRef.current;
    if (!markersCanvas) return;
    
    const ctx = markersCanvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, markersCanvas.width, markersCanvas.height);
    
    // Draw underlines first (below markers)
    underlines.forEach((line) => {
      ctx.save();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.8;
      
      // Draw wavy line
      const amplitude = 4;
      const frequency = 0.05;
      const distance = Math.sqrt(Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2));
      const angle = Math.atan2(line.y2 - line.y1, line.x2 - line.x1);
      
      ctx.translate(line.x1, line.y1);
      ctx.rotate(angle);
      
      ctx.beginPath();
      for (let i = 0; i <= distance; i += 1) {
        const y = Math.sin(i * frequency) * amplitude;
        if (i === 0) {
          ctx.moveTo(i, y);
        } else {
          ctx.lineTo(i, y);
        }
      }
      ctx.stroke();
      ctx.restore();
    });
    
    // Draw markers
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

  useEffect(() => {
    redrawMarkers();
  }, [markers, underlines, hoveredMarkerIndex, markerColor]);

  const saveToHistory = () => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push({
      markers: [...markers],
      underlines: [...underlines],
      greenCount,
      redCount
    });
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

    if (markerColor === 'underline') {
      if (!underlineStart) {
        setUnderlineStart({ x, y });
      } else {
        const newUnderline = {
          x1: underlineStart.x,
          y1: underlineStart.y,
          x2: x,
          y2: y
        };
        setUnderlines(prev => [...prev, newUnderline]);
        setUnderlineStart(null);
        setTimeout(() => saveToHistory(), 0);
      }
      return;
    }

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
          setGreenCount(prev => {
            const newCount = Math.max(0, prev - 1);
            setTimeout(() => saveToHistory(), 0);
            return newCount;
          });
        } else {
          setRedCount(prev => {
            const newCount = Math.max(0, prev - 1);
            setTimeout(() => saveToHistory(), 0);
            return newCount;
          });
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
        setGreenCount(prev => {
          const newCount = prev + 1;
          setTimeout(() => saveToHistory(), 0);
          return newCount;
        });
      } else if (markerColor === 'red') {
        setRedCount(prev => {
          const newCount = prev + 1;
          setTimeout(() => saveToHistory(), 0);
          return newCount;
        });
      }
    }
  };

  const undo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      const state = history[newStep];
      setMarkers([...state.markers]);
      setUnderlines([...state.underlines]);
      setGreenCount(state.greenCount);
      setRedCount(state.redCount);
      setHistoryStep(newStep);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      const state = history[newStep];
      setMarkers([...state.markers]);
      setUnderlines([...state.underlines]);
      setGreenCount(state.greenCount);
      setRedCount(state.redCount);
      setHistoryStep(newStep);
    }
  };

  const clearCanvas = () => {
    if (markers.length === 0 && underlines.length === 0) {
      return;
    }
    
    if (window.confirm('Вы уверены, что хотите удалить все выделения?')) {
      setMarkers([]);
      setUnderlines([]);
      setUnderlineStart(null);
      setGreenCount(0);
      setRedCount(0);
      setTimeout(() => saveToHistory(), 0);
    }
  };

  const handleSave = () => {
    if (markers.length === 0 && underlines.length === 0) {
      setShowSaveConfirm(true);
      return;
    }
    setShowSaveConfirm(true);
  };

  const confirmSave = () => {
    console.log('confirmSave called');
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }

    console.log('Creating temp canvas, markers count:', markers.length);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (tempCtx) {
      tempCtx.drawImage(canvas, 0, 0);
      
      // Draw underlines
      underlines.forEach((line) => {
        tempCtx.save();
        tempCtx.strokeStyle = '#22c55e';
        tempCtx.lineWidth = 3;
        tempCtx.globalAlpha = 0.8;
        
        const amplitude = 4;
        const frequency = 0.05;
        const distance = Math.sqrt(Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2));
        const angle = Math.atan2(line.y2 - line.y1, line.x2 - line.x1);
        
        tempCtx.translate(line.x1, line.y1);
        tempCtx.rotate(angle);
        
        tempCtx.beginPath();
        for (let i = 0; i <= distance; i += 1) {
          const y = Math.sin(i * frequency) * amplitude;
          if (i === 0) {
            tempCtx.moveTo(i, y);
          } else {
            tempCtx.lineTo(i, y);
          }
        }
        tempCtx.stroke();
        tempCtx.restore();
      });
      
      // Draw markers
      tempCtx.globalAlpha = 0.4;
      markers.forEach((marker) => {
        tempCtx.fillStyle = marker.color === 'green' ? '#22c55e' : '#ef4444';
        tempCtx.beginPath();
        tempCtx.arc(marker.x, marker.y, marker.size, 0, Math.PI * 2);
        tempCtx.fill();
      });
      tempCtx.globalAlpha = 1.0;
      
      const dataUrl = tempCanvas.toDataURL('image/png');
      console.log('Calling onSave with dataUrl length:', dataUrl.length);
      
      localStorage.removeItem(storageKey);
      
      onSave(dataUrl);
      setShowSaveConfirm(false);
      console.log('Save completed');
    }
  };

  return (
    <>
      {showSaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-3 mb-4">
              <Icon name="AlertTriangle" className="text-yellow-600 mt-0.5 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Подтверждение сохранения</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Найдено ошибок: <strong>{greenCount + redCount}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Дисграфия: <span className="text-green-600 font-semibold">{greenCount}</span>, 
                  Дизорфография: <span className="text-red-600 font-semibold">{redCount}</span>
                </p>
                <p className="text-sm text-gray-700 mt-3">
                  После сохранения маркеры будут объединены с изображением, и редактор закроется.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                onClick={() => setShowSaveConfirm(false)} 
                size="sm"
                variant="outline"
              >
                Отмена
              </Button>
              <Button 
                onClick={confirmSave} 
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Icon name="Check" className="mr-1" size={14} />
                Да, сохранить
              </Button>
            </div>
          </div>
        </div>
      )}
    
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
              onClick={() => { setMarkerColor('green'); setUnderlineStart(null); }}
              className={markerColor === 'green' ? 'bg-green-500 hover:bg-green-600' : ''}
            >
              <Icon name="Highlighter" className="mr-1" size={14} />
              Дисграфия
            </Button>
            <Button
              size="sm"
              variant={markerColor === 'red' ? 'default' : 'outline'}
              onClick={() => { setMarkerColor('red'); setUnderlineStart(null); }}
              className={markerColor === 'red' ? 'bg-red-500 hover:bg-red-600' : ''}
            >
              <Icon name="Highlighter" className="mr-1" size={14} />
              Дизорфография
            </Button>
            <Button
              size="sm"
              variant={markerColor === 'underline' ? 'default' : 'outline'}
              onClick={() => { setMarkerColor('underline'); setUnderlineStart(null); }}
              className={markerColor === 'underline' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              <Icon name="Underline" className="mr-1" size={14} />
              Подчеркнуть
            </Button>
            <Button
              size="sm"
              variant={markerColor === 'eraser' ? 'default' : 'outline'}
              onClick={() => { setMarkerColor('eraser'); setUnderlineStart(null); }}
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
            <Button 
              onClick={handleSave} 
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Icon name="Save" className="mr-1" size={14} />
              Сохранить
            </Button>
            <Button size="sm" variant="outline" onClick={clearCanvas}>
              <Icon name="RotateCcw" className="mr-1" size={14} />
              Очистить
            </Button>
          </div>
        </div>
        
        {markerColor === 'underline' && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Icon name="Info" className="text-green-600" size={16} />
              <span className="text-sm text-green-800">
                {underlineStart ? 'Кликните в конечную точку подчеркивания' : 'Кликните в начальную точку подчеркивания'}
              </span>
            </div>
          </div>
        )}
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="w-full p-4 flex items-center justify-between hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Icon name="Info" className="text-blue-600" size={16} />
            <span className="font-semibold text-blue-900">Как размечать?</span>
          </div>
          <Icon 
            name={showInstructions ? "ChevronUp" : "ChevronDown"} 
            className="text-blue-600" 
            size={20} 
          />
        </button>
        {showInstructions && (
          <div className="px-4 pb-4">
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
              <li>Зелёным выделяйте дисграфические ошибки (нарушения письма)</li>
              <li>Красным выделяйте дизорфографические ошибки (орфографические)</li>
              <li>Ластик поможет убрать лишние выделения</li>
              <li>После разметки нажмите "Сохранить разметку"</li>
            </ul>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default ImageAnnotator;