import { useRef, useEffect, MouseEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { MarkerColor, Marker, Underline } from './types';

interface CheckModalProps {
  imageUrl: string;
  processedImageUrl: string | null;
  rotation: number;
  markerColor: MarkerColor;
  markerSize: number;
  markers: Marker[];
  underlines: Underline[];
  greenCount: number;
  redCount: number;
  underlineStart: { x: number; y: number } | null;
  onMarkerColorChange: (color: MarkerColor) => void;
  onMarkerSizeChange: (size: number) => void;
  onMarkersChange: (markers: Marker[]) => void;
  onUnderlinesChange: (underlines: Underline[]) => void;
  onUnderlineStartChange: (start: { x: number; y: number } | null) => void;
  onCountsChange: (green: number, red: number) => void;
  onClear: () => void;
  onSave: (bakedImageUrl?: string) => void;
  onClose: () => void;
}

const CheckModal = ({
  imageUrl,
  processedImageUrl,
  rotation,
  markerColor,
  markerSize,
  markers,
  underlines,
  greenCount,
  redCount,
  underlineStart,
  onMarkerColorChange,
  onMarkerSizeChange,
  onMarkersChange,
  onUnderlinesChange,
  onUnderlineStartChange,
  onCountsChange,
  onClear,
  onSave,
  onClose
}: CheckModalProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markersCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const markersCanvas = markersCanvasRef.current;
    if (!canvas || !markersCanvas) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = processedImageUrl || imageUrl;
    
    img.onload = () => {
      imageRef.current = img;
      
      let displayWidth = img.width;
      let displayHeight = img.height;

      if (rotation % 180 !== 0) {
        [displayWidth, displayHeight] = [displayHeight, displayWidth];
      }

      canvas.width = displayWidth;
      canvas.height = displayHeight;
      markersCanvas.width = displayWidth;
      markersCanvas.height = displayHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.translate(displayWidth / 2, displayHeight / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
      }

      drawMarkers();
    };
  }, [imageUrl, processedImageUrl, rotation]);

  useEffect(() => {
    drawMarkers();
  }, [markers, underlines]);

  const drawMarkers = () => {
    const markersCanvas = markersCanvasRef.current;
    if (!markersCanvas) return;

    const ctx = markersCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, markersCanvas.width, markersCanvas.height);

    markers.forEach(marker => {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = marker.color === 'green' ? '#22c55e' : '#ef4444';
      ctx.beginPath();
      ctx.arc(marker.x, marker.y, marker.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    underlines.forEach(underline => {
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      
      const dx = underline.x2 - underline.x1;
      const dy = underline.y2 - underline.y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      const waveLength = 8;
      const waveHeight = 3;
      const steps = Math.ceil(length / waveLength);
      
      ctx.beginPath();
      ctx.moveTo(underline.x1, underline.y1);
      
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = underline.x1 + dx * t;
        const y = underline.y1 + dy * t;
        const offsetY = Math.sin(i * Math.PI) * waveHeight;
        
        const perpX = -dy / length;
        const perpY = dx / length;
        
        ctx.lineTo(x + perpX * offsetY, y + perpY * offsetY);
      }
      
      ctx.stroke();
    });
  };

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    if (markerColor === 'crop') return;

    const rect = markersCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (markerColor === 'underline') {
      if (!underlineStart) {
        onUnderlineStartChange({ x, y });
      } else {
        const newUnderline: Underline = {
          x1: underlineStart.x,
          y1: underlineStart.y,
          x2: x,
          y2: y
        };
        onUnderlinesChange([...underlines, newUnderline]);
        onUnderlineStartChange(null);
        onCountsChange(greenCount + 1, redCount);
      }
      return;
    }

    if (markerColor === 'eraser') {
      handleErase(x, y);
      setIsDrawing(true);
      return;
    }

    if (markerColor === 'green' || markerColor === 'red') {
      const newMarker: Marker = { x, y, color: markerColor, size: markerSize };
      onMarkersChange([...markers, newMarker]);
      
      if (markerColor === 'green') {
        onCountsChange(greenCount + 1, redCount);
      } else {
        onCountsChange(greenCount, redCount + 1);
      }
      setIsDrawing(true);
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const rect = markersCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (markerColor === 'eraser') {
      handleErase(x, y);
    } else if (markerColor === 'green' || markerColor === 'red') {
      const newMarker: Marker = { x, y, color: markerColor, size: markerSize };
      onMarkersChange([...markers, newMarker]);
      
      if (markerColor === 'green') {
        onCountsChange(greenCount + 1, redCount);
      } else {
        onCountsChange(greenCount, redCount + 1);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleErase = (x: number, y: number) => {
    const eraseRadius = markerSize;
    
    let greenRemoved = 0;
    let redRemoved = 0;
    
    const newMarkers = markers.filter(marker => {
      const distance = Math.sqrt(Math.pow(marker.x - x, 2) + Math.pow(marker.y - y, 2));
      if (distance < eraseRadius + marker.size / 2) {
        if (marker.color === 'green') {
          greenRemoved++;
        } else {
          redRemoved++;
        }
        return false;
      }
      return true;
    });

    const newUnderlines = underlines.filter(underline => {
      const distToLine = pointToLineDistance(
        x, y,
        underline.x1, underline.y1,
        underline.x2, underline.y2
      );
      if (distToLine < eraseRadius) {
        greenRemoved++;
        return false;
      }
      return true;
    });

    if (greenRemoved > 0 || redRemoved > 0) {
      onCountsChange(
        Math.max(0, greenCount - greenRemoved),
        Math.max(0, redCount - redRemoved)
      );
    }

    onMarkersChange(newMarkers);
    onUnderlinesChange(newUnderlines);
  };

  const pointToLineDistance = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleSaveAnnotation = () => {
    const canvas = canvasRef.current;
    const markersCanvas = markersCanvasRef.current;
    
    if (!canvas || !markersCanvas) {
      console.error('Canvas не найден');
      return;
    }

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;
    const ctx = finalCanvas.getContext('2d');
    
    if (!ctx) {
      console.error('Не удалось получить контекст');
      return;
    }

    ctx.drawImage(canvas, 0, 0);
    ctx.drawImage(markersCanvas, 0, 0);

    const bakedImageUrl = finalCanvas.toDataURL('image/png');
    console.log('Разметка приклеена к изображению');

    onSave(bakedImageUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Верхняя панель */}
      <div className="bg-white border-b shadow-sm p-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Проверка диктанта</h2>
          
          {/* Счетчики */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium">Дисграфия:</span>
              <span className="text-lg font-bold text-green-600">{greenCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm font-medium">Дизорфография:</span>
              <span className="text-lg font-bold text-red-600">{redCount}</span>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={onClose}>
            <Icon name="X" size={16} />
          </Button>
        </div>
      </div>

      {/* Область изображения */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto flex justify-center">
          <div className="relative inline-block">
            <canvas
              ref={canvasRef}
              className="border border-gray-300 shadow-lg"
            />
            <canvas
              ref={markersCanvasRef}
              className="absolute top-0 left-0 cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
        </div>
      </div>

      {/* Нижняя панель инструментов */}
      <div className="bg-white border-t shadow-sm p-4">
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Инструменты */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700 mr-2">Инструменты:</span>
            <Button
              size="sm"
              variant={markerColor === 'green' ? 'default' : 'outline'}
              onClick={() => onMarkerColorChange('green')}
              className={markerColor === 'green' ? 'bg-green-500 hover:bg-green-600' : ''}
            >
              <Icon name="Highlighter" className="mr-1" size={14} />
              Дисграфия
            </Button>
            <Button
              size="sm"
              variant={markerColor === 'red' ? 'default' : 'outline'}
              onClick={() => onMarkerColorChange('red')}
              className={markerColor === 'red' ? 'bg-red-500 hover:bg-red-600' : ''}
            >
              <Icon name="Highlighter" className="mr-1" size={14} />
              Дизорфография
            </Button>
            <Button
              size="sm"
              variant={markerColor === 'underline' ? 'default' : 'outline'}
              onClick={() => onMarkerColorChange('underline')}
              className={markerColor === 'underline' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              <Icon name="Underline" className="mr-1" size={14} />
              Подчеркнуть
            </Button>
            <Button
              size="sm"
              variant={markerColor === 'eraser' ? 'default' : 'outline'}
              onClick={() => onMarkerColorChange('eraser')}
              className={markerColor === 'eraser' ? 'bg-gray-700 hover:bg-gray-800' : ''}
            >
              <Icon name="Eraser" className="mr-1" size={14} />
              Ластик
            </Button>
          </div>

          {/* Размер */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Размер:</span>
            <input
              type="range"
              min="10"
              max="40"
              value={markerSize}
              onChange={(e) => onMarkerSizeChange(Number(e.target.value))}
              className="flex-1 max-w-xs"
            />
            <span className="text-sm text-gray-600 w-12">{markerSize}px</span>
          </div>

          {/* Подсказка */}
          {markerColor === 'underline' && (
            <div className="bg-green-50 border border-green-300 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <Icon name="Info" className="text-green-600" size={16} />
                <span className="text-sm text-green-800">
                  {underlineStart 
                    ? 'Кликните в конечную точку подчеркивания' 
                    : 'Кликните в начальную точку подчеркивания'}
                </span>
              </div>
            </div>
          )}

          {/* Действия */}
          <div className="flex gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={onClear}>
              <Icon name="RotateCcw" className="mr-1" size={14} />
              Очистить разметку
            </Button>
            <Button 
              variant="default"
              size="sm" 
              onClick={handleSaveAnnotation}
              disabled={markers.length === 0 && underlines.length === 0}
            >
              <Icon name="Save" className="mr-1" size={14} />
              Сохранить проверку
            </Button>
            <Button 
              size="sm" 
              className="ml-auto bg-green-600 hover:bg-green-700"
              onClick={onClose}
            >
              <Icon name="Check" className="mr-1" size={14} />
              Готово
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckModal;