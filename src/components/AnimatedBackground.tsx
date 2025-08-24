import { useEffect, useState } from 'react';

interface Swirl {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity: number;
  speed: number;
  direction: number;
}

export default function AnimatedBackground() {
  const [swirls, setSwirls] = useState<Swirl[]>([]);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    // Генерируем много завитушек
    const generateSwirls = () => {
      const newSwirls: Swirl[] = [];
      for (let i = 0; i < 40; i++) {
        newSwirls.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 60 + 20,
          rotation: Math.random() * 360,
          opacity: Math.random() * 0.1 + 0.05,
          speed: Math.random() * 0.5 + 0.2,
          direction: Math.random() > 0.5 ? 1 : -1,
        });
      }
      setSwirls(newSwirls);
    };

    generateSwirls();

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {swirls.map((swirl) => (
        <div
          key={swirl.id}
          className="absolute text-green-500"
          style={{
            left: `${swirl.x}%`,
            top: `${swirl.y}%`,
            fontSize: `${swirl.size}px`,
            opacity: swirl.opacity,
            transform: `rotate(${swirl.rotation + scrollY * swirl.speed * swirl.direction}deg) scale(${1 + Math.sin(scrollY * 0.001 + swirl.id) * 0.2})`,
            transition: 'transform 0.1s ease-out',
          }}
        >
          <svg
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2C8 6 4 10 4 14a8 8 0 1 0 16 0c0-4-4-8-8-12Z" />
            <path d="M8 14s1.5-2 4-2 4 2 4 2" />
            <circle cx="12" cy="16" r="1" />
          </svg>
        </div>
      ))}
      
      {/* Дополнительные завитушки другой формы */}
      {swirls.slice(0, 25).map((swirl) => (
        <div
          key={`swirl2-${swirl.id}`}
          className="absolute text-green-400"
          style={{
            left: `${(swirl.x + 30) % 100}%`,
            top: `${(swirl.y + 40) % 100}%`,
            fontSize: `${swirl.size * 0.8}px`,
            opacity: swirl.opacity * 0.7,
            transform: `rotate(${-swirl.rotation - scrollY * swirl.speed * swirl.direction * 0.8}deg) scale(${0.8 + Math.cos(scrollY * 0.0015 + swirl.id) * 0.3})`,
            transition: 'transform 0.1s ease-out',
          }}
        >
          <svg
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </div>
      ))}

      {/* Третий слой завитушек */}
      {swirls.slice(0, 20).map((swirl) => (
        <div
          key={`swirl3-${swirl.id}`}
          className="absolute text-green-300"
          style={{
            left: `${(swirl.x + 60) % 100}%`,
            top: `${(swirl.y + 20) % 100}%`,
            fontSize: `${swirl.size * 1.2}px`,
            opacity: swirl.opacity * 0.5,
            transform: `rotate(${swirl.rotation * 1.5 + scrollY * swirl.speed * swirl.direction * 1.2}deg) scale(${1.2 + Math.sin(scrollY * 0.0008 + swirl.id * 2) * 0.4})`,
            transition: 'transform 0.1s ease-out',
          }}
        >
          <svg
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      ))}
    </div>
  );
}