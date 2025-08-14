import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeAlt: string;
  afterAlt: string;
}

export default function BeforeAfterSlider({ beforeImage, afterImage, beforeAlt, afterAlt }: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(percentage);
  };

  const handleTouchStart = () => {
    setIsDragging(true);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(percentage);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setPosition(percentage);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Результаты наших учеников</h3>
        <p className="text-gray-600">Перетащите ползунок, чтобы увидеть прогресс</p>
      </div>
      
      <div 
        ref={containerRef}
        className="relative overflow-hidden rounded-lg cursor-ew-resize select-none"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        <div className="relative">
          <img 
            src={beforeImage} 
            alt={beforeAlt}
            className="w-full h-auto block"
            draggable={false}
          />
          <div 
            className="absolute inset-0 overflow-hidden"
            style={{clipPath: `inset(0 ${100 - position}% 0 0)`}}
          >
            <img 
              src={afterImage} 
              alt={afterAlt}
              className="w-full h-auto block"
              draggable={false}
            />
          </div>
          
          {/* Slider */}
          <div 
            className="absolute inset-y-0 flex items-center z-10 pointer-events-none"
            style={{left: `${position}%`, transform: 'translateX(-50%)'}}
          >
            <div className="w-1 bg-white h-full shadow-lg"></div>
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className={`w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-green-500 transition-transform ${isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab hover:scale-105'}`}>
                <Icon name="Move" size={20} className="text-green-600" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Labels */}
        <div className="flex justify-between mt-4 px-4">
          <div className="text-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1"></div>
            <span className="text-sm font-medium text-gray-700">До коррекции</span>
          </div>
          <div className="text-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
            <span className="text-sm font-medium text-gray-700">После коррекции</span>
          </div>
        </div>
      </div>
    </div>
  );
}