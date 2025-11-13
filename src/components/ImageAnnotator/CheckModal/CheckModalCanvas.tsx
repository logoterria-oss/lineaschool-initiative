import { useRef, useEffect, MouseEvent } from 'react';
import { Marker, Underline } from '../types';

interface CheckModalCanvasProps {
  imageUrl: string;
  processedImageUrl: string | null;
  rotation: number;
  markers: Marker[];
  underlines: Underline[];
  onMouseDown: (e: MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
  onImageLoad: (img: HTMLImageElement, canvas: HTMLCanvasElement, markersCanvas: HTMLCanvasElement) => void;
}

const CheckModalCanvas = ({
  imageUrl,
  processedImageUrl,
  rotation,
  markers,
  underlines,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onImageLoad
}: CheckModalCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markersCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

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
      onImageLoad(img, canvas, markersCanvas);
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

  return (
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
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />
        </div>
      </div>
    </div>
  );
};

export default CheckModalCanvas;
