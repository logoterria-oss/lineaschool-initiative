export default function AnimatedBackground() {
  console.log("AnimatedBackground рендерится!");
  
  return (
    <div 
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-50"
      style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)' }}
    >
      <div className="absolute top-4 left-4 bg-red-500 text-white text-2xl p-4 rounded z-50">
        🔴 КОМПОНЕНТ РАБОТАЕТ!
      </div>
      
      <div className="absolute top-20 left-20 text-green-500 text-6xl">
        🌀
      </div>
      
      <div className="absolute top-40 left-40 text-green-500 text-6xl">
        🌀
      </div>
    </div>
  );
}