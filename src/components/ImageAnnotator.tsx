import { useRef, useEffect, useState } from 'react';
import { ImageAnnotatorProps, Marker, Underline, HistoryState, MarkerColor } from './ImageAnnotator/types';
import ErrorCounter from './ImageAnnotator/ErrorCounter';
import Toolbar from './ImageAnnotator/Toolbar';
import SaveConfirmModal from './ImageAnnotator/SaveConfirmModal';
import AnnotationCanvas from './ImageAnnotator/AnnotationCanvas';
import Instructions from './ImageAnnotator/Instructions';

const ImageAnnotator = ({ imageUrl, onSave }: ImageAnnotatorProps) => {
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
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

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

  const handleImageLoad = (img: HTMLImageElement, canvas: HTMLCanvasElement) => {
    imageRef.current = img;
    canvasRef.current = canvas;
    saveToHistory();
  };

  const handleMarkerColorChange = (color: MarkerColor) => {
    setMarkerColor(color);
    setUnderlineStart(null);
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
    setTimeout(() => saveToHistory(), 0);
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

        <AnnotationCanvas
          imageUrl={imageUrl}
          markers={markers}
          underlines={underlines}
          markerColor={markerColor}
          markerSize={markerSize}
          underlineStart={underlineStart}
          hoveredMarkerIndex={hoveredMarkerIndex}
          onImageLoad={handleImageLoad}
          onMarkerAdd={handleMarkerAdd}
          onMarkerRemove={handleMarkerRemove}
          onUnderlineAdd={handleUnderlineAdd}
          onUnderlineStartSet={setUnderlineStart}
          onHoveredMarkerChange={setHoveredMarkerIndex}
        />

        <Instructions />
      </div>
    </>
  );
};

export default ImageAnnotator;