import { useEffect, useState } from 'react';

interface Spiral {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  scale: number;
}

export default function AnimatedSpirals() {
  const [spirals, setSpirals] = useState<Spiral[]>([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Фиксированные позиции завитушек в пикселях от краев
  const fixedPositions = [
    { x: 50, y: 150, side: 'left' },    // Левый верх
    { x: 80, y: 300, side: 'right' },   // Правый верх
    { x: 30, y: 500, side: 'left' },    // Левый центр
    { x: 100, y: 700, side: 'right' },  // Правый центр
    { x: 70, y: 900, side: 'left' },    // Левый низ
    { x: 60, y: 1100, side: 'right' },  // Правый низ
    { x: 40, y: 1300, side: 'left' },   // Левый далеко
    { x: 120, y: 450, side: 'right' },  // Правый дополнительный
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
      size: 60 + Math.random() * 30,
      opacity: 0,
      scale: 0,
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
    const updateSpirals = () => {
      const windowHeight = window.innerHeight;
      
      setSpirals(prev => prev.map((spiral, index) => {
        // Рассчитываем позицию завитушки относительно скролла
        const spiralScreenY = spiral.y - scrollY;
        
        // Завитушка видна если находится в области от -200px до высоты экрана + 200px
        const isInViewport = spiralScreenY > -200 && spiralScreenY < windowHeight + 200;
        
        let opacity = 0;
        let scale = 0;
        
        if (isInViewport) {
          // Рассчитываем прогресс появления
          const centerY = windowHeight / 2;
          const distance = Math.abs(spiralScreenY - centerY);
          const maxDistance = windowHeight / 2 + 200;
          const progress = Math.max(0, 1 - (distance / maxDistance));
          
          opacity = progress * 0.4; // Максимум 40%
          scale = 0.5 + (progress * 0.7); // От 0.5 до 1.2
        }
        
        return {
          ...spiral,
          opacity,
          scale,
        };
      }));
    };
    
    updateSpirals();
  }, [scrollY]);

  return (
    <>
      <style>{`
        @keyframes spiralFloat {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(90deg);
          }
          50% {
            transform: rotate(180deg);
          }
          75% {
            transform: rotate(270deg);
          }
        }
        
        .spiral-element {
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
      `}</style>

      {!prefersReducedMotion && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {spirals.map((spiral) => (
            <div
              key={spiral.id}
              className="absolute spiral-element"
              style={{
                left: fixedPositions[spiral.id].side === 'left' ? `${spiral.x}px` : 'auto',
                right: fixedPositions[spiral.id].side === 'right' ? `${spiral.x}px` : 'auto',
                top: `${spiral.y}px`,
                width: `${spiral.size}px`,
                height: `${spiral.size}px`,
                opacity: spiral.opacity,
                transform: `scale(${spiral.scale})`,
                animation: spiral.opacity > 0 ? 'spiralFloat 15s linear infinite' : 'none',
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