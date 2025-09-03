import { useEffect, useState } from 'react';

interface Spiral {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

export default function AnimatedSpirals() {
  const [spirals, setSpirals] = useState<Spiral[]>([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference and mobile device
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    setIsMobile(window.innerWidth <= 768);
    
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    const handleMotionChange = () => setPrefersReducedMotion(mediaQuery.matches);
    
    window.addEventListener('resize', handleResize);
    mediaQuery.addEventListener('change', handleMotionChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  useEffect(() => {
    const generateSpirals = () => {
      const newSpirals: Spiral[] = [];
      // Reduce spiral count on mobile for better performance
      const spiralCount = isMobile ? 4 : 8;

      for (let i = 0; i < spiralCount; i++) {
        // Случайно выбираем сторону экрана
        const side = Math.floor(Math.random() * 4); // 0=левая, 1=правая, 2=верхняя, 3=нижняя
        let x, y;
        
        switch (side) {
          case 0: // Левая сторона
            x = Math.random() * 15; // 0-15%
            y = Math.random() * 100;
            break;
          case 1: // Правая сторона
            x = 85 + Math.random() * 15; // 85-100%
            y = Math.random() * 100;
            break;
          case 2: // Верхняя сторона
            x = 15 + Math.random() * 70; // 15-85%
            y = Math.random() * 20; // 0-20%
            break;
          case 3: // Нижняя сторона
            x = 15 + Math.random() * 70; // 15-85%
            y = 80 + Math.random() * 20; // 80-100%
            break;
          default:
            x = Math.random() * 15;
            y = Math.random() * 100;
        }

        newSpirals.push({
          id: i,
          x,
          y,
          size: isMobile ? Math.random() * 40 + 30 : Math.random() * 100 + 60, // Smaller on mobile
          duration: isMobile ? Math.random() * 30 + 20 : Math.random() * 20 + 15, // Slower on mobile
          delay: Math.random() * 10,
        });
      }
      setSpirals(newSpirals);
    };

    generateSpirals();
  }, [isMobile]);

  return (
    <>
      <style>{`
        @keyframes spiralSpin {
          from {
            transform: rotate(0deg) scale(0.8);
          }
          50% {
            transform: rotate(180deg) scale(1.1);
          }
          to {
            transform: rotate(360deg) scale(0.8);
          }
        }
      `}</style>

      {!prefersReducedMotion && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {spirals.map((spiral) => (
          <div
            key={spiral.id}
            className="absolute opacity-40 md:opacity-20"
            style={{
              // Исправлено: Используем шаблонные литералы правильно в JSX style
              left: `${spiral.x}%`, 
              top: `${spiral.y}%`,
              width: `${spiral.size}px`,
              height: `${spiral.size}px`,
              animation: `spiralSpin ${spiral.duration}s linear infinite`, // Интерполируем всю строку анимации
              animationDelay: `${spiral.delay}s`, // Интерполируем всю строку задержки
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
                opacity="0.8"
              />
            </svg>
          </div>
          ))}
        </div>
      )}
    </>
  );
}