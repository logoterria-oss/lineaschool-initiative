import { useEffect, useState } from 'react';

export default function MobileOptimizedSpirals() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Задержка для улучшения производительности
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Простые статичные завитушки для мобильных */}
      <div className="absolute left-4 top-32 w-8 h-8 opacity-20">
        <svg viewBox="0 0 100 100">
          <path
            d="M50,50 Q75,25 75,50 Q75,75 50,75 Q25,75 25,50"
            fill="none"
            stroke="rgb(34, 197, 94)"
            strokeWidth="3"
          />
        </svg>
      </div>
      
      <div className="absolute right-4 top-64 w-6 h-6 opacity-15">
        <svg viewBox="0 0 100 100">
          <path
            d="M50,50 Q75,25 75,50 Q75,75 50,75"
            fill="none"
            stroke="rgb(34, 197, 94)"
            strokeWidth="3"
          />
        </svg>
      </div>
      
      <div className="absolute left-6 top-96 w-10 h-10 opacity-10">
        <svg viewBox="0 0 100 100">
          <path
            d="M50,50 Q75,25 75,50 Q75,75 50,75 Q25,75 25,50 Q25,25 50,25"
            fill="none"
            stroke="rgb(34, 197, 94)"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  );
}