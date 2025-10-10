import Icon from '@/components/ui/icon';

interface ErrorCounterProps {
  greenCount: number;
  redCount: number;
}

const ErrorCounter = ({ greenCount, redCount }: ErrorCounterProps) => {
  return (
    <div className="bg-gradient-to-r from-green-50 to-red-50 border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <span className="text-sm font-medium text-gray-700">Дисграфия:</span>
          <span className="text-2xl font-bold text-green-600">{greenCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500"></div>
          <span className="text-sm font-medium text-gray-700">Дизорфография:</span>
          <span className="text-2xl font-bold text-red-600">{redCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="Circle" className="text-gray-400" size={16} />
          <span className="text-sm font-medium text-gray-700">Всего:</span>
          <span className="text-2xl font-bold text-gray-700">{greenCount + redCount}</span>
        </div>
      </div>
    </div>
  );
};

export default ErrorCounter;
