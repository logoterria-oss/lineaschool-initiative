import { useRef, useEffect, useState } from 'react';
import { CropArea } from './types';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface CropCanvasProps {
  imageUrl: string;
  initialCropArea: CropArea | null;
  onApply: (cropArea: CropArea) => void;
  onCancel: () => void;
}

const CropCanvas = ({ imageUrl, initialCropArea, onApply, onCancel }: CropCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [cropArea, setCropArea] = useState<CropArea | null>(initialCropArea);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const proxyUrl = `https://functions.poehali.dev/4e7a1ed9-4e38-45c8-804c-decf67141ce5?url=${encodeURIComponent(imageUrl)}`;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      canvas.width = img.width;
      canvas.height = img.height;
      drawCanvas();
    };
    img.src = proxyUrl;
  }, [imageUrl]);

  useEffect(() => {
    drawCanvas();
  }, [cropArea]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    if (cropArea) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
      ctx.drawImage(
        img,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height
      );

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    setIsDragging(true);
    setDragStart({ x, y });
    setCropArea({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const newCropArea = {
      x: Math.min(dragStart.x, x),
      y: Math.min(dragStart.y, y),
      width: Math.abs(x - dragStart.x),
      height: Math.abs(y - dragStart.y)
    };
    
    setCropArea(newCropArea);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleApply = () => {
    if (cropArea && cropArea.width > 0 && cropArea.height > 0) {
      onApply(cropArea);
    }
  };

  const handleReset = () => {
    setCropArea(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-300 rounded-lg">
        <div className="flex items-center gap-2">
          <Icon name="Info" className="text-blue-600" size={16} />
          <span className="text-sm text-blue-800">
            Выделите область для кадрирования мышкой
          </span>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleReset} variant="outline" size="sm">
            <Icon name="RotateCcw" className="mr-1" size={14} />
            Сбросить
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={!cropArea || cropArea.width === 0}
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Icon name="Check" className="mr-1" size={14} />
            Применить
          </Button>
          <Button onClick={onCancel} variant="outline" size="sm">
            <Icon name="X" className="mr-1" size={14} />
            Отмена
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-auto bg-gray-100 p-4">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="cursor-crosshair mx-auto shadow-lg"
          style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
        />
      </div>
    </div>
  );
};

export default CropCanvas;
