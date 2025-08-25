import { useEffect, useState } from 'react';

export default function AnimatedBackground() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Завитушки как были
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
  ];

  // Новые декоративные элементы в стиле логопеда
  const decorativeElements = [
    // Кружочки разных размеров
    { x: 5, y: 25, size: 8, type: 'circle', color: '#10b981', opacity: 0.15, speed: 0.05 },
    { x: 92, y: 18, size: 12, type: 'circle', color: '#34d399', opacity: 0.12, speed: -0.03 },
    { x: 18, y: 65, size: 6, type: 'circle', color: '#6ee7b7', opacity: 0.18, speed: 0.04 },
    { x: 88, y: 75, size: 10, type: 'circle', color: '#10b981', opacity: 0.14, speed: -0.06 },
    { x: 45, y: 12, size: 14, type: 'circle', color: '#34d399', opacity: 0.16, speed: 0.03 },

    // Треугольники
    { x: 8, y: 45, size: 16, type: 'triangle', color: '#10b981', opacity: 0.1, speed: 0.04, rotation: 30 },
    { x: 78, y: 22, size: 12, type: 'triangle', color: '#34d399', opacity: 0.12, speed: -0.05, rotation: 180 },
    { x: 22, y: 88, size: 18, type: 'triangle', color: '#6ee7b7', opacity: 0.08, speed: 0.06, rotation: 90 },

    // Линии и штрихи
    { x: 12, y: 35, size: 20, type: 'line', color: '#10b981', opacity: 0.08, speed: 0.03, rotation: 45 },
    { x: 85, y: 58, size: 24, type: 'line', color: '#34d399', opacity: 0.1, speed: -0.04, rotation: 135 },
    { x: 35, y: 15, size: 16, type: 'line', color: '#6ee7b7', opacity: 0.12, speed: 0.05, rotation: 90 },

    // Дуги и полукруги
    { x: 25, y: 55, size: 22, type: 'arc', color: '#10b981', opacity: 0.09, speed: 0.04, rotation: 0 },
    { x: 70, y: 42, size: 18, type: 'arc', color: '#34d399', opacity: 0.11, speed: -0.03, rotation: 90 },
    { x: 55, y: 78, size: 20, type: 'arc', color: '#6ee7b7', opacity: 0.08, speed: 0.05, rotation: 180 },

    // Звездочки
    { x: 28, y: 28, size: 14, type: 'star', color: '#10b981', opacity: 0.1, speed: 0.06 },
    { x: 72, y: 65, size: 16, type: 'star', color: '#34d399', opacity: 0.08, speed: -0.04 },

    // Листочки
    { x: 42, y: 72, size: 18, type: 'leaf', color: '#10b981', opacity: 0.12, speed: 0.03, rotation: 45 },
    { x: 15, y: 52, size: 15, type: 'leaf', color: '#34d399', opacity: 0.09, speed: -0.05, rotation: 135 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Завитушки как были */}
      {swirls.map((swirl, index) => (
        <div
          key={`swirl-${index}`}
          className="absolute"
          style={{
            left: `${swirl.x}%`,
            top: `${swirl.y}%`,
            fontSize: `${swirl.size}px`,
            color: '#10b981',
            opacity: 0.12,
            transform: `
              rotate(${swirl.rotation + scrollY * swirl.speed}deg) 
              scale(${1 + Math.sin(scrollY * 0.001 + index) * 0.08})
            `,
            transition: 'transform 0.1s ease-out',
          }}
        >
          {swirl.type === 0 && (
            <svg width="1em" height="1em" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M25,50 Q35,25 55,35 Q75,25 80,50 Q75,75 55,65 Q35,75 25,50" />
              <circle cx="52" cy="50" r="1.5" fill="currentColor" opacity="0.6" />
            </svg>
          )}
          {swirl.type === 1 && (
            <svg width="1em" height="1em" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M20,40 Q40,20 70,40 Q85,60 70,80 Q40,90 20,70 Q10,50 20,40" />
              <path d="M40,40 Q55,30 70,40 Q80,60 70,80 Q55,85 40,75" />
            </svg>
          )}
          {swirl.type === 2 && (
            <svg width="1em" height="1em" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M50,20 Q75,40 65,70 Q35,90 15,70 Q5,40 35,30 Q60,35 55,55 Q45,65 40,55" />
              <circle cx="42" cy="55" r="1" fill="currentColor" opacity="0.4" />
            </svg>
          )}
        </div>
      ))}

      {/* Новые декоративные элементы */}
      {decorativeElements.map((element, index) => (
        <div
          key={`deco-${index}`}
          className="absolute"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            fontSize: `${element.size}px`,
            color: element.color,
            opacity: element.opacity,
            transform: `
              rotate(${(element.rotation || 0) + scrollY * element.speed}deg) 
              scale(${1 + Math.sin(scrollY * 0.0008 + index * 0.7) * 0.15})
              translateY(${Math.sin(scrollY * 0.0003 + index) * 10}px)
            `,
            transition: 'transform 0.1s ease-out',
          }}
        >
          {element.type === 'circle' && (
            <svg width="1em" height="1em" viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="50" r="45" />
            </svg>
          )}
          {element.type === 'triangle' && (
            <svg width="1em" height="1em" viewBox="0 0 100 100" fill="currentColor">
              <polygon points="50,15 85,75 15,75" />
            </svg>
          )}
          {element.type === 'line' && (
            <svg width="1em" height="1em" viewBox="0 0 100 100" stroke="currentColor" strokeWidth="8" strokeLinecap="round">
              <line x1="20" y1="50" x2="80" y2="50" />
            </svg>
          )}
          {element.type === 'arc' && (
            <svg width="1em" height="1em" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
              <path d="M 20 50 Q 50 20 80 50" />
            </svg>
          )}
          {element.type === 'star' && (
            <svg width="1em" height="1em" viewBox="0 0 100 100" fill="currentColor">
              <polygon points="50,10 55,35 80,35 60,55 65,80 50,65 35,80 40,55 20,35 45,35" />
            </svg>
          )}
          {element.type === 'leaf' && (
            <svg width="1em" height="1em" viewBox="0 0 100 100" fill="currentColor">
              <path d="M50,85 Q20,60 25,35 Q30,10 50,15 Q70,10 75,35 Q80,60 50,85" />
              <path d="M50,85 Q50,65 50,45" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}