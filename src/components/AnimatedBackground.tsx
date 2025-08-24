import { useEffect, useState } from 'react';

export default function AnimatedBackground() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const swirls = [
    { x: 10, y: 20, size: 30, rotation: 45, opacity: 0.05, speed: 0.2 },
    { x: 85, y: 15, size: 25, rotation: 120, opacity: 0.04, speed: -0.15 },
    { x: 5, y: 60, size: 35, rotation: 200, opacity: 0.06, speed: 0.3 },
    { x: 90, y: 50, size: 28, rotation: 310, opacity: 0.05, speed: -0.25 },
    { x: 15, y: 90, size: 32, rotation: 80, opacity: 0.04, speed: 0.18 },
    { x: 75, y: 85, size: 26, rotation: 150, opacity: 0.05, speed: -0.2 },
    { x: 45, y: 10, size: 40, rotation: 270, opacity: 0.06, speed: 0.35 },
    { x: 55, y: 35, size: 22, rotation: 60, opacity: 0.04, speed: -0.12 },
    { x: 25, y: 45, size: 38, rotation: 180, opacity: 0.05, speed: 0.28 },
    { x: 70, y: 70, size: 24, rotation: 330, opacity: 0.04, speed: -0.18 },
    { x: 35, y: 75, size: 33, rotation: 100, opacity: 0.06, speed: 0.22 },
    { x: 80, y: 25, size: 29, rotation: 240, opacity: 0.05, speed: -0.16 },
    { x: 20, y: 30, size: 27, rotation: 15, opacity: 0.04, speed: 0.24 },
    { x: 95, y: 40, size: 31, rotation: 135, opacity: 0.05, speed: -0.3 },
    { x: 8, y: 80, size: 36, rotation: 290, opacity: 0.06, speed: 0.19 },
    { x: 65, y: 55, size: 23, rotation: 75, opacity: 0.04, speed: -0.14 },
    { x: 40, y: 65, size: 34, rotation: 210, opacity: 0.05, speed: 0.26 },
    { x: 85, y: 10, size: 25, rotation: 345, opacity: 0.04, speed: -0.21 },
    { x: 12, y: 50, size: 37, rotation: 165, opacity: 0.06, speed: 0.17 },
    { x: 60, y: 90, size: 28, rotation: 90, opacity: 0.05, speed: -0.13 },
    { x: 30, y: 20, size: 26, rotation: 225, opacity: 0.04, speed: 0.31 },
    { x: 78, y: 75, size: 35, rotation: 30, opacity: 0.05, speed: -0.19 },
    { x: 18, y: 40, size: 24, rotation: 120, opacity: 0.04, speed: 0.23 },
    { x: 92, y: 60, size: 32, rotation: 285, opacity: 0.06, speed: -0.27 },
    { x: 50, y: 80, size: 30, rotation: 45, opacity: 0.05, speed: 0.15 }
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {swirls.map((swirl, index) => (
        <div
          key={index}
          className="absolute text-green-500 transition-transform duration-75 ease-out"
          style={{
            left: `${swirl.x}%`,
            top: `${swirl.y}%`,
            fontSize: `${swirl.size}px`,
            opacity: swirl.opacity,
            transform: `rotate(${swirl.rotation + scrollY * swirl.speed}deg) scale(${1 + Math.sin(scrollY * 0.002 + index) * 0.2})`,
          }}
        >
          <svg
            width="1em"
            height="1em"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M20,50 Q30,20 50,30 Q70,40 80,20 Q90,30 85,50 Q80,70 60,65 Q40,60 35,80 Q30,70 20,50" />
            <circle cx="35" cy="45" r="2" fill="currentColor" opacity="0.3" />
          </svg>
        </div>
      ))}
      
      {swirls.slice(0, 15).map((swirl, index) => (
        <div
          key={`leaf-${index}`}
          className="absolute text-green-400 transition-transform duration-75 ease-out"
          style={{
            left: `${(swirl.x + 40) % 100}%`,
            top: `${(swirl.y + 30) % 100}%`,
            fontSize: `${swirl.size * 0.8}px`,
            opacity: swirl.opacity * 0.7,
            transform: `rotate(${-swirl.rotation - scrollY * swirl.speed * 0.8}deg) scale(${0.9 + Math.cos(scrollY * 0.0015 + index) * 0.25})`,
          }}
        >
          <svg
            width="1em"
            height="1em"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path d="M50,85 Q20,60 25,35 Q30,10 50,15 Q70,10 75,35 Q80,60 50,85" />
            <path d="M50,85 Q50,65 50,45" stroke="currentColor" strokeWidth="0.5" />
          </svg>
        </div>
      ))}
    </div>
  );
}