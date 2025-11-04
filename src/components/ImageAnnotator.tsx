import { useRef, useEffect, useState } from 'react';
import { ImageAnnotatorProps, Marker, Underline, HistoryState, MarkerColor, CropArea } from './ImageAnnotator/types';
import ErrorCounter from './ImageAnnotator/ErrorCounter';
import Toolbar from './ImageAnnotator/Toolbar';
import SaveConfirmModal from './ImageAnnotator/SaveConfirmModal';
import CheckModal from './ImageAnnotator/CheckModal';
import AnnotationCanvas from './ImageAnnotator/AnnotationCanvas';
import CropCanvas from './ImageAnnotator/CropCanvas';
import Instructions from './ImageAnnotator/Instructions';

const ImageAnnotator = ({ imageUrl, onSave, savedMarkup }: ImageAnnotatorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markersCanvasRef = useRef<HTMLCanvasElement>(null);
  const [markerColor, setMarkerColor] = useState<MarkerColor>('green');
  const [markerSize, setMarkerSize] = useState(20);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [greenCount, setGreenCount] = useState(0);
  const [redCount, setRedCount] = useState(0);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [underlines, setUnderlines] = useState<Underline[]>([]);
  const [underlineStart, setUnderlineStart] = useState<{x: number, y: number} | null>(null);
  const [hoveredMarkerIndex, setHoveredMarkerIndex] = useState<number | null>(null);
  const [hoveredUnderlineIndex, setHoveredUnderlineIndex] = useState<number | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [cropDragStart, setCropDragStart] = useState<{x: number, y: number} | null>(null);
  const [rotation, setRotation] = useState(0);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);

  const storageKey = `annotator_${imageUrl}`;

  useEffect(() => {
    if (savedMarkup) {
      try {
        const data = JSON.parse(savedMarkup);
        setMarkers(data.markers || []);
        setUnderlines(data.underlines || []);
        setGreenCount(data.greenCount || 0);
        setRedCount(data.redCount || 0);
        setRotation(data.rotation || 0);
        setProcessedImageUrl(data.processedImageUrl || null);
        setCropArea(null);
      } catch (e) {
        console.error('Failed to load saved markup:', e);
      }
    } else {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setMarkers(data.markers || []);
          setUnderlines(data.underlines || []);
          setGreenCount(data.greenCount || 0);
          setRedCount(data.redCount || 0);
          setRotation(data.rotation || 0);
          setCropArea(data.cropArea || null);
          setProcessedImageUrl(null);
        } catch (e) {
          console.error('Failed to load saved markers:', e);
        }
      }
    }
  }, [imageUrl, savedMarkup, storageKey]);

  useEffect(() => {
    if (markers.length > 0 || underlines.length > 0 || greenCount > 0 || redCount > 0 || cropArea) {
      localStorage.setItem(storageKey, JSON.stringify({
        markers,
        underlines,
        greenCount,
        redCount,
        cropArea
      }));
    }
  }, [markers, underlines, greenCount, redCount, cropArea, storageKey]);

  const saveToHistory = () => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push({
      markers: [...markers],
      underlines: [...underlines],
      greenCount,
      redCount,
      cropArea
    });
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleImageLoad = (img: HTMLImageElement, canvas: HTMLCanvasElement, markersCanvas: HTMLCanvasElement) => {
    imageRef.current = img;
    canvasRef.current = canvas;
    markersCanvasRef.current = markersCanvas;
    saveToHistory();
  };

  const handleMarkerColorChange = (color: MarkerColor) => {
    setMarkerColor(color);
    setUnderlineStart(null);
    setCropDragStart(null);
    if (['green', 'red', 'underline', 'eraser'].includes(color)) {
      setShowCheckModal(true);
    }
  };

  const handleOpenCheckModal = async () => {
    if (cropArea && !processedImageUrl) {
      await applyCropBeforeCheck();
    }
    setMarkerColor('green');
    setShowCheckModal(true);
  };

  const applyCropBeforeCheck = () => {
    return new Promise<void>((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas || !cropArea) {
        resolve();
        return;
      }

      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) {
        resolve();
        return;
      }

      const cropWidth = cropArea.width;
      const cropHeight = cropArea.height;
      tempCanvas.width = cropWidth;
      tempCanvas.height = cropHeight;

      ctx.drawImage(
        canvas,
        cropArea.x,
        cropArea.y,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      const croppedImageUrl = tempCanvas.toDataURL('image/png');
      setProcessedImageUrl(croppedImageUrl);
      setCropArea(null);
      setRotation(0);
      
      setTimeout(() => resolve(), 100);
    });
  };

  const handleCloseCheckModal = () => {
    setShowCheckModal(false);
    setMarkerColor('green');
    setUnderlineStart(null);
  };

  const handleCropApply = (area: CropArea) => {
    setCropArea(area);
    setMarkerColor('green');
    setTimeout(() => saveToHistory(), 0);
  };

  const handleCropCancel = () => {
    setMarkerColor('green');
    setCropDragStart(null);
  };

  const handleMarkerAdd = (marker: Marker) => {
    setMarkers(prev => [...prev, marker]);
    
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
  };

  const handleMarkerRemove = (index: number) => {
    const removedMarker = markers[index];
    const newMarkers = markers.filter((_, i) => i !== index);
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
  };

  const handleUnderlineAdd = (underline: Underline) => {
    setUnderlines(prev => [...prev, underline]);
    setGreenCount(prev => {
      const newCount = prev + 1;
      setTimeout(() => saveToHistory(), 0);
      return newCount;
    });
  };

  const handleUnderlineRemove = (index: number) => {
    const newUnderlines = underlines.filter((_, i) => i !== index);
    setUnderlines(newUnderlines);
    setGreenCount(prev => {
      const newCount = Math.max(0, prev - 1);
      setTimeout(() => saveToHistory(), 0);
      return newCount;
    });
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

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
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
    const markersCanvas = markersCanvasRef.current;
    if (!canvas || !markersCanvas) {
      console.error('Canvas not found');
      return;
    }

    console.log('Creating temp canvas, markers count:', markers.length);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    const tempCtx = tempCanvas.getContext('2d');
    
    if (tempCtx) {
      // "Запекаем" изображение и разметку вместе
      tempCtx.drawImage(canvas, 0, 0);
      tempCtx.drawImage(markersCanvas, 0, 0);
      
      // Сохраняем объединенное изображение как base64
      const newProcessedImageUrl = tempCanvas.toDataURL('image/png');
      
      const markupData = JSON.stringify({
        markers: [],
        underlines: [],
        greenCount,
        redCount,
        cropArea: null,
        rotation: 0,
        processedImageUrl: newProcessedImageUrl
      });
      console.log('Calling onSave with baked markup data');
      
      localStorage.removeItem(storageKey);
      
      // Обновляем локальное состояние для продолжения работы
      setProcessedImageUrl(newProcessedImageUrl);
      setMarkers([]);
      setUnderlines([]);
      setRotation(0);
      setCropArea(null);
      
      onSave(markupData);
      setShowSaveConfirm(false);
      console.log('Save completed');
    }
  };

  return (
    <>
      {showSaveConfirm && (
        <SaveConfirmModal
          greenCount={greenCount}
          redCount={redCount}
          onConfirm={confirmSave}
          onCancel={() => setShowSaveConfirm(false)}
        />
      )}

      {showCheckModal && (
        <CheckModal
          imageUrl={imageUrl}
          processedImageUrl={processedImageUrl}
          rotation={rotation}
          markerColor={markerColor}
          markerSize={markerSize}
          markers={markers}
          underlines={underlines}
          greenCount={greenCount}
          redCount={redCount}
          underlineStart={underlineStart}
          onMarkerColorChange={handleMarkerColorChange}
          onMarkerSizeChange={setMarkerSize}
          onMarkersChange={setMarkers}
          onUnderlinesChange={setUnderlines}
          onUnderlineStartChange={setUnderlineStart}
          onCountsChange={(green, red) => {
            setGreenCount(green);
            setRedCount(red);
          }}
          onClear={clearCanvas}
          onSave={handleSave}
          onClose={handleCloseCheckModal}
        />
      )}
    
      <div className="space-y-4">
        <ErrorCounter greenCount={greenCount} redCount={redCount} />
        
        <Toolbar
          markerColor={markerColor}
          markerSize={markerSize}
          underlineStart={underlineStart}
          hasMarkup={markers.length > 0 || underlines.length > 0}
          onMarkerColorChange={handleMarkerColorChange}
          onMarkerSizeChange={setMarkerSize}
          onOpenCheckModal={handleOpenCheckModal}
          onSave={handleSave}
          onClear={clearCanvas}
          onRotate={handleRotate}
        />

        {markerColor === 'crop' ? (
          <CropCanvas
            imageUrl={processedImageUrl || imageUrl}
            initialCropArea={cropArea}
            onApply={handleCropApply}
            onCancel={handleCropCancel}
          />
        ) : (
          <AnnotationCanvas
          imageUrl={processedImageUrl || imageUrl}
          markers={markers}
          underlines={underlines}
          markerColor={markerColor}
          markerSize={markerSize}
          underlineStart={underlineStart}
          hoveredMarkerIndex={hoveredMarkerIndex}
          hoveredUnderlineIndex={hoveredUnderlineIndex}
          cropArea={cropArea}
          rotation={rotation}
          onImageLoad={handleImageLoad}
          onMarkerAdd={handleMarkerAdd}
          onMarkerRemove={handleMarkerRemove}
          onUnderlineAdd={handleUnderlineAdd}
          onUnderlineRemove={handleUnderlineRemove}
          onUnderlineStartSet={setUnderlineStart}
          onHoveredMarkerChange={setHoveredMarkerIndex}
          onHoveredUnderlineChange={setHoveredUnderlineIndex}
        />
        )}

        <Instructions />
      </div>
    </>
  );
};

export default ImageAnnotator;