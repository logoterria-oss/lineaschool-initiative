export default function LoadingState() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Загрузка данных...</h2>
        <p className="text-gray-600">Пожалуйста, подождите</p>
      </div>
    </div>
  );
}