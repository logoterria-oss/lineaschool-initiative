import { useEffect, useState } from 'react';

interface Spiral {
  id: number;
  x: number;
  y: number;
  size: number;
  visible: boolean;
  opacity: number;
}

export default function AnimatedSpirals() {
  const [spirals, setSpirals] = useState<Spiral[]>([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Фиксированные позиции завитушек в безопасных местах
  const fixedPositions = [
    { x: 5, y: 15 },   // Левый верх
    { x: 92, y: 25 },  // Правый верх  
    { x: 3, y: 45 },   // Левый центр
    { x: 88, y: 55 },  // Правый центр
    { x: 8, y: 75 },   // Левый низ
    { x: 90, y: 85 },  // Правый низ
    { x: 2, y: 92 },   // Левый самый низ
    { x: 85, y: 8 },   // Правый самый верх
  ];

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleMotionChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleMotionChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  useEffect(() => {
    // Создаем завитушки на фиксированных позициях
    const newSpirals: Spiral[] = fixedPositions.map((pos, index) => ({
      id: index,
      x: pos.x,
      y: pos.y,
      size: 60 + Math.random() * 40,
      visible: false,
      opacity: 0,
    }));
    setSpirals(newSpirals);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Обновляем видимость завитушек на основе скролла
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollProgress = Math.min(scrollY / (documentHeight || 1), 1);
    
    setSpirals(prev => prev.map((spiral, index) => {
      // Каждая завитушка появляется на разной стадии скролла
      const triggerPoint = (index / prev.length) * 0.8; // 0 до 80% скролла
      const fadeRange = 0.1; // 10% от общего скролла для плавного появления
      
      let opacity = 0;
      let visible = false;
      
      if (scrollProgress >= triggerPoint) {
        visible = true;
        const fadeProgress = Math.min((scrollProgress - triggerPoint) / fadeRange, 1);
        opacity = fadeProgress * 0.3; // Максимальная прозрачность 30%
      }
      
      // Исчезание к концу страницы
      if (scrollProgress > 0.9) {
        const fadeOutProgress = (scrollProgress - 0.9) / 0.1;
        opacity *= (1 - fadeOutProgress);
      }
      
      return {
        ...spiral,
        visible,
        opacity,
      };
    }));
  }, [scrollY]);

  return (
    <>
      <style>{`
        @keyframes spiralAppear {
          0% {
            transform: rotate(0deg) scale(0);
            opacity: 0;
          }
          50% {
            transform: rotate(180deg) scale(1.2);
          }
          100% {
            transform: rotate(360deg) scale(1);
          }
        }
        
        @keyframes spiralFloat {
          0%, 100% {
            transform: rotate(0deg) scale(1);
          }
          50% {
            transform: rotate(180deg) scale(1.05);
          }
        }
        
        .spiral-element {
          transition: opacity 0.8s ease-out;
        }
      `}</style>

      {!prefersReducedMotion && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {spirals.map((spiral) => (
            <div
              key={spiral.id}
              className="absolute spiral-element"
              style={{
                left: `${spiral.x}%`,
                top: `${spiral.y}%`,
                width: `${spiral.size}px`,
                height: `${spiral.size}px`,
                opacity: spiral.opacity,
                animation: spiral.visible 
                  ? 'spiralAppear 1.5s ease-out, spiralFloat 20s linear infinite 1.5s'
                  : 'none',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 100 100"
              >
                <path
                  d="M50,50 Q75,25 75,50 Q75,75 50,75 Q25,75 25,50 Q25,25 50,25 Q60,35 60,50 Q60,60 50,60 Q45,60 45,50 Q45,47 50,47"
                  fill="none"
                  stroke="rgb(34, 197, 94)"
                  strokeWidth="2"
                  opacity="0.9"
                />
              </svg>
            </div>
          ))}
        </div>
      )}
    </>
  );
}