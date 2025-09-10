import { useEffect, useState } from 'react';

interface Spiral {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  scale: number;
  side: 'left' | 'right';
}

export default function AnimatedSpirals() {
  const [spirals, setSpirals] = useState<Spiral[]>([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Уменьшенные позиции для мобильных
  const fixedPositions = isMobile ? [
    { x: 20, y: 200, side: 'left' },    // Только 4 завитушки для мобильных
    { x: 30, y: 600, side: 'right' },
    { x: 25, y: 1000, side: 'left' },
    { x: 35, y: 1400, side: 'right' },
  ] : [
    { x: 50, y: 150, side: 'left' },
    { x: 80, y: 300, side: 'right' },
    { x: 30, y: 500, side: 'left' },
    { x: 100, y: 700, side: 'right' },
    { x: 70, y: 900, side: 'left' },
    { x: 60, y: 1100, side: 'right' },
    { x: 40, y: 1300, side: 'left' },
    { x: 120, y: 450, side: 'right' },
  ];

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileQuery = window.matchMedia('(max-width: 768px)');
    
    setPrefersReducedMotion(mediaQuery.matches);
    setIsMobile(mobileQuery.matches);
    
    const handleMotionChange = () => setPrefersReducedMotion(mediaQuery.matches);
    const handleMobileChange = () => setIsMobile(mobileQuery.matches);
    
    mediaQuery.addEventListener('change', handleMotionChange);
    mobileQuery.addEventListener('change', handleMobileChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
      mobileQuery.removeEventListener('change', handleMobileChange);
    };
  }, []);

  useEffect(() => {
    // Создаем завитушки на фиксированных позициях
    const newSpirals: Spiral[] = fixedPositions.map((pos, index) => ({
      id: index,
      x: pos.x,
      y: pos.y,
      size: isMobile ? 40 : 80, // Уменьшенный размер на мобильных
      opacity: 0,
      scale: 1,
      side: pos.side,
    }));
    setSpirals(newSpirals);
  }, [isMobile]);

  // Упрощенная анимация для мобильных
  useEffect(() => {
    if (isMobile || prefersReducedMotion) {
      // На мобильных показываем статичные завитушки с низкой прозрачностью
      setSpirals(prev => prev.map(spiral => ({
        ...spiral,
        opacity: 0.15,
        scale: 0.8
      })));
      return;
    }

    let animationFrame: number;
    
    const updateSpirals = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      setSpirals(prev => prev.map(spiral => {
        const spiralScreenY = spiral.y - scrollY;
        const isInViewport = spiralScreenY > -200 && spiralScreenY < windowHeight + 200;
        
        let opacity = 0;
        let scale = 0;
        
        if (isInViewport) {
          const centerY = windowHeight / 2;
          const distance = Math.abs(spiralScreenY - centerY);
          const maxDistance = windowHeight / 2 + 200;
          const progress = Math.max(0, 1 - (distance / maxDistance));
          
          opacity = progress * 0.4;
          scale = 0.5 + (progress * 0.7);
        }
        
        return { ...spiral, opacity, scale };
      }));
    };

    const handleScroll = () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(updateSpirals);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateSpirals(); // Инициальный вызов
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isMobile, prefersReducedMotion]);



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

      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {spirals.map((spiral) => (
          <div
            key={spiral.id}
            className="absolute spiral-element"
            style={{
              left: spiral.side === 'left' ? `${spiral.x}px` : 'auto',
              right: spiral.side === 'right' ? `${spiral.x}px` : 'auto',
              top: `${spiral.y}px`,
              width: `${spiral.size}px`,
              height: `${spiral.size}px`,
              opacity: spiral.opacity,
              transform: `scale(${spiral.scale})`,
              animation: (!isMobile && !prefersReducedMotion && spiral.opacity > 0) 
                ? 'spiralFloat 20s linear infinite' : 'none',
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
                strokeWidth={isMobile ? "1" : "2"}
                opacity="0.9"
              />
            </svg>
          </div>
        ))}
      </div>
    </>
  );
}