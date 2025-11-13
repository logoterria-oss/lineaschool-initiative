/**
 * ⚠️ КРИТИЧЕСКИЙ КОМПОНЕНТ - НЕ ИЗМЕНЯТЬ БЕЗ НЕОБХОДИМОСТИ
 * 
 * Модальное окно проверки диктанта с разметкой ошибок
 * 
 * Ключевой функционал:
 * - Отрисовка canvas с изображением диктанта
 * - Разметка ошибок маркерами (зелёные/красные) и подчёркиваниями
 * - Модальное окно выбора типа ошибки (ErrorTypeModal)
 * - Сбор и передача errorTypes при сохранении
 * - Запекание разметки в изображение
 * 
 * ВАЖНО: При сохранении errorTypes собираются из markers и underlines
 * и передаются через onSave(bakedImageUrl, allErrorTypes)
 * 
 * Последнее изменение: 13.11.2025
 */

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { MarkerColor, Marker, Underline } from './types';
import ErrorTypeModal from './ErrorTypeModal';
import CheckModalCanvas from './CheckModal/CheckModalCanvas';
import CheckModalToolbar from './CheckModal/CheckModalToolbar';
import { useCheckModalMouseHandlers } from './CheckModal/useCheckModalMouseHandlers';

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
  onSave: (bakedImageUrl?: string, errorTypes?: Record<string, number>) => void;
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
  const [showErrorTypeModal, setShowErrorTypeModal] = useState(false);
  const [pendingMarker, setPendingMarker] = useState<{x: number, y: number} | null>(null);
  const [errorTypes, setErrorTypes] = useState<Record<string, number>>({});

  const mouseHandlers = useCheckModalMouseHandlers(
    markerColor,
    markerSize,
    markers,
    underlines,
    greenCount,
    redCount,
    underlineStart,
    isDrawing,
    markersCanvasRef,
    onMarkersChange,
    onUnderlinesChange,
    onCountsChange,
    onUnderlineStartChange,
    setIsDrawing,
    setPendingMarker,
    setShowErrorTypeModal
  );

  const handleImageLoad = (img: HTMLImageElement, canvas: HTMLCanvasElement, markersCanvas: HTMLCanvasElement) => {
    imageRef.current = img;
    canvasRef.current = canvas;
    markersCanvasRef.current = markersCanvas;
  };

  const handleErrorTypeSelect = (errorType: string) => {
    if (!pendingMarker) return;

    if (underlineStart) {
      const newUnderline: Underline = {
        x1: underlineStart.x,
        y1: underlineStart.y,
        x2: pendingMarker.x,
        y2: pendingMarker.y,
        errorType
      };
      onUnderlinesChange([...underlines, newUnderline]);
      onUnderlineStartChange(null);
      onCountsChange(greenCount + 1, redCount);
      setErrorTypes(prev => ({
        ...prev,
        [errorType]: (prev[errorType] || 0) + 1
      }));
    } else {
      const newMarker: Marker = {
        x: pendingMarker.x,
        y: pendingMarker.y,
        color: 'green',
        size: markerSize,
        errorType
      };
      onMarkersChange([...markers, newMarker]);
      onCountsChange(greenCount + 1, redCount);
      setErrorTypes(prev => ({
        ...prev,
        [errorType]: (prev[errorType] || 0) + 1
      }));
    }

    setShowErrorTypeModal(false);
    setPendingMarker(null);
  };

  const handleErrorTypeCancel = () => {
    setShowErrorTypeModal(false);
    if (underlineStart && pendingMarker) {
      onUnderlineStartChange(null);
    }
    setPendingMarker(null);
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
    
    const allErrorTypes = { ...errorTypes };
    markers.forEach(marker => {
      if (marker.errorType) {
        allErrorTypes[marker.errorType] = (allErrorTypes[marker.errorType] || 0) + 1;
      }
    });
    underlines.forEach(underline => {
      if (underline.errorType) {
        allErrorTypes[underline.errorType] = (allErrorTypes[underline.errorType] || 0) + 1;
      }
    });
    
    console.log('Разметка приклеена к изображению, типы ошибок:', allErrorTypes);

    onSave(bakedImageUrl, allErrorTypes);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      <div className="bg-white border-b shadow-sm p-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Проверка диктанта</h2>
          
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

      <CheckModalCanvas
        imageUrl={imageUrl}
        processedImageUrl={processedImageUrl}
        rotation={rotation}
        markers={markers}
        underlines={underlines}
        onMouseDown={mouseHandlers.handleMouseDown}
        onMouseMove={mouseHandlers.handleMouseMove}
        onMouseUp={mouseHandlers.handleMouseUp}
        onImageLoad={handleImageLoad}
      />

      <CheckModalToolbar
        markerColor={markerColor}
        markerSize={markerSize}
        underlineStart={underlineStart}
        hasMarkup={markers.length > 0 || underlines.length > 0}
        onMarkerColorChange={onMarkerColorChange}
        onMarkerSizeChange={onMarkerSizeChange}
        onClear={onClear}
        onSave={handleSaveAnnotation}
      />

      {showErrorTypeModal && (
        <ErrorTypeModal
          open={showErrorTypeModal}
          onSelect={handleErrorTypeSelect}
          onCancel={handleErrorTypeCancel}
        />
      )}
    </div>
  );
};

export default CheckModal;