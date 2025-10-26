import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ImageCropperProps {
  imageUrl: string;
  onSave: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ImageCropper = ({ imageUrl, onSave, onCancel }: ImageCropperProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      
      const containerWidth = canvas.parentElement?.clientWidth || 800;
      const scaleToFit = Math.min(containerWidth / img.width, 800 / img.height, 1);
      setScale(scaleToFit);
      
      canvas.width = img.width * scaleToFit;
      canvas.height = img.height * scaleToFit;
      
      drawCanvas();
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    drawCanvas();
  }, [cropArea, scale]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (cropArea) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
      ctx.drawImage(
        img,
        cropArea.x / scale,
        cropArea.y / scale,
        cropArea.width / scale,
        cropArea.height / scale,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height
      );

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setDragStart({ x, y });
    setCropArea({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCropArea({
      x: Math.min(dragStart.x, x),
      y: Math.min(dragStart.y, y),
      width: Math.abs(x - dragStart.x),
      height: Math.abs(y - dragStart.y)
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleCrop = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !cropArea || cropArea.width === 0 || cropArea.height === 0) return;

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropArea.width / scale;
    croppedCanvas.height = cropArea.height / scale;
    
    const ctx = croppedCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      img,
      cropArea.x / scale,
      cropArea.y / scale,
      cropArea.width / scale,
      cropArea.height / scale,
      0,
      0,
      croppedCanvas.width,
      croppedCanvas.height
    );

    croppedCanvas.toBlob((blob) => {
      if (blob) {
        const croppedUrl = URL.createObjectURL(blob);
        onSave(croppedUrl);
      }
    }, 'image/png');
  };

  const handleReset = () => {
    setCropArea(null);
    setDragStart(null);
    setIsDragging(false);
    drawCanvas();
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Icon name="Crop" className="text-white" size={20} />
            <h2 className="text-lg font-semibold text-white">Кадрирование изображения</h2>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleReset} variant="outline" size="sm">
              <Icon name="RotateCcw" className="mr-2" size={16} />
              Сбросить
            </Button>
            <Button 
              onClick={handleCrop} 
              disabled={!cropArea || cropArea.width === 0}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <Icon name="Check" className="mr-2" size={16} />
              Применить
            </Button>
            <Button onClick={onCancel} variant="outline" size="sm">
              <Icon name="X" className="mr-2" size={16} />
              Отмена
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
        <div className="relative">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="border-2 border-gray-600 cursor-crosshair shadow-2xl"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>

      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <div className="max-w-7xl mx-auto text-sm text-gray-400 text-center">
          Выделите область для кадрирования, зажав левую кнопку мыши и перетащив курсор
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
