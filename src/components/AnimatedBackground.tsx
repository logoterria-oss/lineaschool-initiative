import { useEffect, useState } from 'react';

export default function AnimatedBackground() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const swirls = [
    { x: 15, y: 20, size: 30, rotation: 45, speed: 0.1, type: 0 },
    { x: 85, y: 15, size: 25, rotation: 120, speed: -0.08, type: 1 },
    { x: 10, y: 60, size: 35, rotation: 200, speed: 0.12, type: 2 },
    { x: 90, y: 50, size: 28, rotation: 310, speed: -0.1, type: 0 },
    { x: 25, y: 80, size: 32, rotation: 80, speed: 0.09, type: 1 },
    { x: 75, y: 85, size: 22, rotation: 150, speed: -0.07, type: 2 },
    { x: 50, y: 10, size: 38, rotation: 270, speed: 0.11, type: 0 },
    { x: 65, y: 35, size: 26, rotation: 60, speed: -0.06, type: 1 },
    { x: 35, y: 45, size: 33, rotation: 180, speed: 0.08, type: 2 },
    { x: 80, y: 70, size: 29, rotation: 330, speed: -0.09, type: 0 },
    { x: 20, y: 75, size: 31, rotation: 100, speed: 0.1, type: 1 },
    { x: 70, y: 25, size: 27, rotation: 240, speed: -0.08, type: 2 },
    { x: 40, y: 90, size: 36, rotation: 15, speed: 0.07, type: 0 },
    { x: 95, y: 40, size: 24, rotation: 135, speed: -0.12, type: 1 },
    { x: 12, y: 30, size: 34, rotation: 290, speed: 0.09, type: 2 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {swirls.map((swirl, index) => (
        <div
          key={index}
          className="absolute"
          style={{
            left: `${swirl.x}%`,
            top: `${swirl.y}%`,
            fontSize: `${swirl.size}px`,
            color: '#10b981', // зеленый цвет
            opacity: 0.12,
            transform: `
              rotate(${swirl.rotation + scrollY * swirl.speed}deg) 
              scale(${1 + Math.sin(scrollY * 0.001 + index) * 0.08})
            `,
            transition: 'transform 0.1s ease-out',
          }}
        >
          {swirl.type === 0 && (
            // Простой завиток
            <svg width="1em" height="1em" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M25,50 Q35,25 55,35 Q75,25 80,50 Q75,75 55,65 Q35,75 25,50" />
              <circle cx="52" cy="50" r="1.5" fill="currentColor" opacity="0.6" />
            </svg>
          )}
          {swirl.type === 1 && (
            // Двойной завиток
            <svg width="1em" height="1em" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M20,40 Q40,20 70,40 Q85,60 70,80 Q40,90 20,70 Q10,50 20,40" />
              <path d="M40,40 Q55,30 70,40 Q80,60 70,80 Q55,85 40,75" />
            </svg>
          )}
          {swirl.type === 2 && (
            // Спиральный завиток
            <svg width="1em" height="1em" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M50,20 Q75,40 65,70 Q35,90 15,70 Q5,40 35,30 Q60,35 55,55 Q45,65 40,55" />
              <circle cx="42" cy="55" r="1" fill="currentColor" opacity="0.4" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}