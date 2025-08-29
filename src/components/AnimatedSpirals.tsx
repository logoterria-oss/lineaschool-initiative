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

  useEffect(() => {
    const generateSpirals = () => {
      const newSpirals: Spiral[] = [];
      const spiralCount = 8; // Редкие спирали

      for (let i = 0; i < spiralCount; i++) {
        newSpirals.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 30 + 20, // 20-50px
          duration: Math.random() * 20 + 15, // 15-35 секунд
          delay: Math.random() * 10, // 0-10 секунд задержка
        });
      }
      setSpirals(newSpirals);
    };

    generateSpirals();
  }, []);

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
      
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        {spirals.map((spiral) => (
          <div
            key={spiral.id}
            className="absolute opacity-20"
            style={{
              left: `${spiral.x}%`,
              top: `${spiral.y}%`,
              width: `${spiral.size}px`,
              height: `${spiral.size}px`,
              animation: `spiralSpin ${spiral.duration}s linear infinite`,
              animationDelay: `${spiral.delay}s`,
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
                opacity="0.6"
              />
            </svg>
          </div>
        ))}
      </div>
    </>
  );
}