export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* СУПЕР ЗАМЕТНЫЙ ТЕСТ */}
      <div className="absolute top-10 left-10 bg-red-500 text-white text-6xl p-4 rounded">
        🔴 ФОН ЕСТЬ!
      </div>
      
      {/* Большие зеленые завитушки для теста */}
      <div className="absolute top-20 left-20 text-green-500 text-9xl">
        🌀
      </div>
      <div className="absolute top-40 left-40 text-green-500 text-9xl">
        🌀
      </div>
      <div className="absolute top-60 left-60 text-green-500 text-9xl">
        🌀
      </div>
    </div>
  );
}