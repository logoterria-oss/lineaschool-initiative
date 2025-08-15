import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface Example {
  beforeImage: string;
  afterImage: string;
  beforeAlt: string;
  afterAlt: string;
}

interface BeforeAfterSliderProps {
  examples: Example[];
}

export default function BeforeAfterSlider({ examples }: BeforeAfterSliderProps) {
  const [currentExample, setCurrentExample] = useState(0);
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [autoAnimation, setAutoAnimation] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  const currentData = examples[currentExample];

  const handleMouseDown = () => {
    setIsDragging(true);
    setAutoAnimation(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => setAutoAnimation(true), 2000);
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
    setAutoAnimation(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTimeout(() => setAutoAnimation(true), 2000);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(percentage);
  };

  const nextExample = () => {
    setCurrentExample((prev) => (prev + 1) % examples.length);
    setPosition(50);
  };

  const prevExample = () => {
    setCurrentExample((prev) => (prev - 1 + examples.length) % examples.length);
    setPosition(50);
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

  useEffect(() => {
    let startTime: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      if (autoAnimation && !isDragging) {
        const progress = (elapsed / 5000) % 2;
        const newPosition = progress <= 1 
          ? 40 + (progress * 20)
          : 60 - ((progress - 1) * 20);
        
        setPosition(newPosition);
      }
      
      if (autoAnimation && !isDragging) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (autoAnimation && !isDragging) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [autoAnimation, isDragging]);

  useEffect(() => {
    setAutoAnimation(true);
  }, [currentExample]);

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6">
      <div 
        ref={containerRef}
        className="relative overflow-hidden rounded-lg cursor-ew-resize select-none"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        <div className="relative">
          <img 
            src={currentData.beforeImage} 
            alt={currentData.beforeAlt}
            className="w-full h-auto block"
            draggable={false}
          />
          <div 
            className="absolute inset-0 overflow-hidden"
            style={{clipPath: `inset(0 ${100 - position}% 0 0)`}}
          >
            <img 
              src={currentData.afterImage} 
              alt={currentData.afterAlt}
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

          {/* Navigation arrows */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              className="w-10 h-10 p-0 bg-white/90 hover:bg-white border-green-500"
              onClick={prevExample}
            >
              <Icon name="ChevronLeft" size={16} className="text-green-600" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-10 h-10 p-0 bg-white/90 hover:bg-white border-green-500"
              onClick={nextExample}
            >
              <Icon name="ChevronRight" size={16} className="text-green-600" />
            </Button>
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

        {/* Example indicator */}
        <div className="flex justify-center mt-4 space-x-2">
          {examples.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentExample(index);
                setPosition(50);
              }}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentExample ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}