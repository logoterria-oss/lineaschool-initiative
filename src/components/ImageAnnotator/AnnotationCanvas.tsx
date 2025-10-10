import { useRef, useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Marker, Underline, MarkerColor } from './types';

interface AnnotationCanvasProps {
  imageUrl: string;
  markers: Marker[];
  underlines: Underline[];
  markerColor: MarkerColor;
  markerSize: number;
  underlineStart: { x: number; y: number } | null;
  hoveredMarkerIndex: number | null;
  onImageLoad: (img: HTMLImageElement, canvas: HTMLCanvasElement) => void;
  onMarkerAdd: (marker: Marker) => void;
  onMarkerRemove: (index: number) => void;
  onUnderlineAdd: (underline: Underline) => void;
  onUnderlineStartSet: (point: { x: number; y: number } | null) => void;
  onHoveredMarkerChange: (index: number | null) => void;
}

const AnnotationCanvas = ({
  imageUrl,
  markers,
  underlines,
  markerColor,
  markerSize,
  underlineStart,
  hoveredMarkerIndex,
  onImageLoad,
  onMarkerAdd,
  onMarkerRemove,
  onUnderlineAdd,
  onUnderlineStartSet,
  onHoveredMarkerChange
}: AnnotationCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markersCanvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

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
            onImageLoad(img, canvas);
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
  }, [imageUrl, onImageLoad]);

  const redrawMarkers = () => {
    const markersCanvas = markersCanvasRef.current;
    if (!markersCanvas) return;
    
    const ctx = markersCanvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, markersCanvas.width, markersCanvas.height);
    
    underlines.forEach((line) => {
      ctx.save();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.8;
      
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

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (markerColor !== 'eraser') {
      onHoveredMarkerChange(null);
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

    onHoveredMarkerChange(hoveredIndex !== -1 ? hoveredIndex : null);
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
        onUnderlineStartSet({ x, y });
      } else {
        const newUnderline = {
          x1: underlineStart.x,
          y1: underlineStart.y,
          x2: x,
          y2: y
        };
        onUnderlineAdd(newUnderline);
        onUnderlineStartSet(null);
      }
      return;
    }

    if (markerColor === 'eraser') {
      const clickedMarkerIndex = markers.findIndex(marker => {
        const distance = Math.sqrt(Math.pow(marker.x - x, 2) + Math.pow(marker.y - y, 2));
        return distance <= marker.size;
      });
      
      if (clickedMarkerIndex !== -1) {
        onMarkerRemove(clickedMarkerIndex);
        onHoveredMarkerChange(null);
      }
    } else {
      const newMarker = {
        x,
        y,
        size: markerSize,
        color: markerColor as 'green' | 'red'
      };
      onMarkerAdd(newMarker);
    }
  };

  return (
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
        onMouseLeave={() => onHoveredMarkerChange(null)}
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
  );
};

export default AnnotationCanvas;