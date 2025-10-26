import { useRef, useEffect, useState } from 'react';
import { ImageAnnotatorProps, Marker, Underline, HistoryState, MarkerColor, CropArea } from './ImageAnnotator/types';
import ErrorCounter from './ImageAnnotator/ErrorCounter';
import Toolbar from './ImageAnnotator/Toolbar';
import SaveConfirmModal from './ImageAnnotator/SaveConfirmModal';
import AnnotationCanvas from './ImageAnnotator/AnnotationCanvas';
import CropCanvas from './ImageAnnotator/CropCanvas';
import Instructions from './ImageAnnotator/Instructions';

const ImageAnnotator = ({ imageUrl, onSave, savedMarkup }: ImageAnnotatorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [cropDragStart, setCropDragStart] = useState<{x: number, y: number} | null>(null);

  const storageKey = `annotator_${imageUrl}`;

  useEffect(() => {
    if (savedMarkup) {
      try {
        const data = JSON.parse(savedMarkup);
        setMarkers(data.markers || []);
        setUnderlines(data.underlines || []);
        setGreenCount(data.greenCount || 0);
        setRedCount(data.redCount || 0);
        setCropArea(data.cropArea || null);
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
          setCropArea(data.cropArea || null);
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

  const handleImageLoad = (img: HTMLImageElement, canvas: HTMLCanvasElement) => {
    imageRef.current = img;
    canvasRef.current = canvas;
    saveToHistory();
  };

  const handleMarkerColorChange = (color: MarkerColor) => {
    setMarkerColor(color);
    setUnderlineStart(null);
    setCropDragStart(null);
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
      
      underlines.forEach((line) => {
        tempCtx.save();
        tempCtx.strokeStyle = '#22c55e';
        tempCtx.lineWidth = 3;
        tempCtx.globalAlpha = 0.8;
        
        const amplitude = 2;
        const frequency = 0.15;
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
      
      tempCtx.globalAlpha = 0.4;
      markers.forEach((marker) => {
        tempCtx.fillStyle = marker.color === 'green' ? '#22c55e' : '#ef4444';
        tempCtx.beginPath();
        tempCtx.arc(marker.x, marker.y, marker.size, 0, Math.PI * 2);
        tempCtx.fill();
      });
      tempCtx.globalAlpha = 1.0;
      
      const markupData = JSON.stringify({
        markers,
        underlines,
        greenCount,
        redCount,
        cropArea
      });
      console.log('Calling onSave with markup data');
      
      localStorage.removeItem(storageKey);
      
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
    
      <div className="space-y-4">
        <ErrorCounter greenCount={greenCount} redCount={redCount} />
        
        <Toolbar
          markerColor={markerColor}
          markerSize={markerSize}
          underlineStart={underlineStart}
          onMarkerColorChange={handleMarkerColorChange}
          onMarkerSizeChange={setMarkerSize}
          onSave={handleSave}
          onClear={clearCanvas}
        />

        {markerColor === 'crop' ? (
          <CropCanvas
            imageUrl={imageUrl}
            initialCropArea={cropArea}
            onApply={handleCropApply}
            onCancel={handleCropCancel}
          />
        ) : (
          <AnnotationCanvas
          imageUrl={imageUrl}
          markers={markers}
          underlines={underlines}
          markerColor={markerColor}
          markerSize={markerSize}
          underlineStart={underlineStart}
          hoveredMarkerIndex={hoveredMarkerIndex}
          hoveredUnderlineIndex={hoveredUnderlineIndex}
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