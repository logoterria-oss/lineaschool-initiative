import { testLocalStorage } from '@/utils/diagUtils';

interface ErrorStateProps {
  error: string;
  serialNumber: string | undefined;
}

export default function ErrorState({ error, serialNumber }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Данные не найдены</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <div className="space-y-3">
          <button 
            onClick={() => window.location.href = '/diag_form'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold w-full"
          >
            Заполнить форму заново
          </button>
          <button 
            onClick={testLocalStorage}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg text-sm w-full"
          >
            Проверить хранилище браузера
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Серийный номер: {serialNumber}
        </p>
      </div>
    </div>
  );
}