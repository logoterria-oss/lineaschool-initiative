import { useEffect, useState } from 'react';

export default function AnimatedBackground() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Больше завитушек с разными размерами и позициями
  const swirls = [];
  for (let i = 0; i < 60; i++) {
    swirls.push({
      x: Math.random() * 100,
      y: Math.random() * 200, // Растянем по всей высоте страницы
      size: Math.random() * 40 + 15,
      rotation: Math.random() * 360,
      opacity: Math.random() * 0.03 + 0.02, // Очень тонкие
      speed: (Math.random() - 0.5) * 0.1, // Очень медленное движение
      type: Math.floor(Math.random() * 3), // 3 разных типа
    });
  }

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
            color: '#10b981',
            opacity: swirl.opacity,
            transform: `
              rotate(${swirl.rotation + scrollY * swirl.speed}deg) 
              scale(${1 + Math.sin(scrollY * 0.001 + index) * 0.1})
              translate(${Math.sin(scrollY * 0.0005 + index) * 20}px, ${Math.cos(scrollY * 0.0005 + index) * 10}px)
            `,
            transition: 'transform 0.1s ease-out',
          }}
        >
          {swirl.type === 0 && (
            // Завиток 1
            <svg width="1em" height="1em" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M20,50 Q30,20 50,30 Q70,20 80,50 Q70,80 50,70 Q30,80 20,50" />
              <circle cx="50" cy="50" r="2" fill="currentColor" opacity="0.5" />
            </svg>
          )}
          {swirl.type === 1 && (
            // Завиток 2  
            <svg width="1em" height="1em" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8">
              <path d="M10,30 Q40,10 70,30 Q90,50 70,70 Q40,90 10,70 Q-10,50 10,30" />
              <path d="M30,30 Q50,20 70,30 Q80,50 70,70 Q50,80 30,70" />
            </svg>
          )}
          {swirl.type === 2 && (
            // Завиток 3
            <svg width="1em" height="1em" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M50,10 Q80,30 70,60 Q40,80 20,60 Q10,30 40,20 Q60,25 50,45" />
              <circle cx="45" cy="45" r="1.5" fill="currentColor" opacity="0.3" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}