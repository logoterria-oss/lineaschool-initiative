import { useEffect, useState } from 'react';

export default function AnimatedBackground() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const swirls = [
    { x: 15, y: 20, size: 35, rotation: 45, speed: 0.2, type: 0 },
    { x: 85, y: 15, size: 28, rotation: 120, speed: -0.15, type: 1 },
    { x: 10, y: 60, size: 40, rotation: 200, speed: 0.3, type: 2 },
    { x: 90, y: 50, size: 32, rotation: 310, speed: -0.25, type: 0 },
    { x: 25, y: 80, size: 30, rotation: 80, speed: 0.18, type: 1 },
    { x: 75, y: 85, size: 25, rotation: 150, speed: -0.2, type: 2 },
    { x: 50, y: 10, size: 38, rotation: 270, speed: 0.35, type: 0 },
    { x: 65, y: 35, size: 26, rotation: 60, speed: -0.12, type: 1 },
    { x: 35, y: 45, size: 33, rotation: 180, speed: 0.28, type: 2 },
    { x: 80, y: 70, size: 29, rotation: 330, speed: -0.18, type: 0 },
    { x: 20, y: 75, size: 31, rotation: 100, speed: 0.22, type: 1 },
    { x: 70, y: 25, size: 27, rotation: 240, speed: -0.16, type: 2 },
    { x: 40, y: 90, size: 36, rotation: 15, speed: 0.24, type: 0 },
    { x: 95, y: 40, size: 24, rotation: 135, speed: -0.3, type: 1 },
    { x: 12, y: 30, size: 34, rotation: 290, speed: 0.19, type: 2 },
    { x: 60, y: 65, size: 28, rotation: 75, speed: -0.14, type: 0 },
    { x: 30, y: 55, size: 32, rotation: 210, speed: 0.26, type: 1 },
    { x: 85, y: 95, size: 25, rotation: 345, speed: -0.21, type: 2 },
    { x: 18, y: 100, size: 37, rotation: 165, speed: 0.17, type: 0 },
    { x: 72, y: 110, size: 30, rotation: 90, speed: -0.13, type: 1 },
    { x: 45, y: 120, size: 35, rotation: 45, speed: 0.2, type: 2 },
    { x: 88, y: 130, size: 28, rotation: 200, speed: -0.15, type: 0 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {swirls.map((swirl, index) => (
        <div
          key={index}
          className="absolute"
          style={{
            left: `${swirl.x}%`,
            top: `${swirl.y}vh`,
            fontSize: `${swirl.size}px`,
            color: '#10b981', // emerald-500
            opacity: 0.08,
            transform: `
              rotate(${swirl.rotation + scrollY * swirl.speed}deg) 
              scale(${1 + Math.sin(scrollY * 0.001 + index) * 0.1})
            `,
            transition: 'transform 0.1s ease-out',
          }}
        >
          {swirl.type === 0 && (
            <svg width="1em" height="1em" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20,50 Q30,20 50,30 Q70,20 80,50 Q70,80 50,70 Q30,80 20,50" />
              <circle cx="50" cy="50" r="2" fill="currentColor" opacity="0.5" />
            </svg>
          )}
          {swirl.type === 1 && (
            <svg width="1em" height="1em" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M15,35 Q35,15 65,35 Q85,55 65,75 Q35,85 15,65 Q5,45 15,35" />
              <path d="M35,35 Q50,25 65,35 Q75,55 65,75 Q50,85 35,75" />
            </svg>
          )}
          {swirl.type === 2 && (
            <svg width="1em" height="1em" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M50,15 Q75,35 65,65 Q35,85 15,65 Q5,35 35,25 Q55,30 50,50" />
              <circle cx="45" cy="50" r="1.5" fill="currentColor" opacity="0.4" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}