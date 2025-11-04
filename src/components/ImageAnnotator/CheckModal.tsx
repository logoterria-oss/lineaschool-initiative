import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { MarkerColor } from './types';

interface CheckModalProps {
  markerColor: MarkerColor;
  markerSize: number;
  greenCount: number;
  redCount: number;
  underlineStart: { x: number; y: number } | null;
  onMarkerColorChange: (color: MarkerColor) => void;
  onMarkerSizeChange: (size: number) => void;
  onClear: () => void;
  onClose: () => void;
}

const CheckModal = ({
  markerColor,
  markerSize,
  greenCount,
  redCount,
  underlineStart,
  onMarkerColorChange,
  onMarkerSizeChange,
  onClear,
  onClose
}: CheckModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Проверка диктанта</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <Icon name="X" size={16} />
          </Button>
        </div>

        {/* Счетчики ошибок */}
        <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium">Дисграфия:</span>
            <span className="text-lg font-bold text-green-600">{greenCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-sm font-medium">Дизорфография:</span>
            <span className="text-lg font-bold text-red-600">{redCount}</span>
          </div>
        </div>

        {/* Инструменты проверки */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Инструменты:</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={markerColor === 'green' ? 'default' : 'outline'}
              onClick={() => onMarkerColorChange('green')}
              className={markerColor === 'green' ? 'bg-green-500 hover:bg-green-600' : ''}
            >
              <Icon name="Highlighter" className="mr-1" size={14} />
              Дисграфия
            </Button>
            <Button
              size="sm"
              variant={markerColor === 'red' ? 'default' : 'outline'}
              onClick={() => onMarkerColorChange('red')}
              className={markerColor === 'red' ? 'bg-red-500 hover:bg-red-600' : ''}
            >
              <Icon name="Highlighter" className="mr-1" size={14} />
              Дизорфография
            </Button>
            <Button
              size="sm"
              variant={markerColor === 'underline' ? 'default' : 'outline'}
              onClick={() => onMarkerColorChange('underline')}
              className={markerColor === 'underline' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              <Icon name="Underline" className="mr-1" size={14} />
              Подчеркнуть
            </Button>
            <Button
              size="sm"
              variant={markerColor === 'eraser' ? 'default' : 'outline'}
              onClick={() => onMarkerColorChange('eraser')}
              className={markerColor === 'eraser' ? 'bg-gray-700 hover:bg-gray-800' : ''}
            >
              <Icon name="Eraser" className="mr-1" size={14} />
              Ластик
            </Button>
          </div>

          {/* Размер маркера */}
          <div className="flex items-center gap-4 pt-2">
            <span className="text-sm font-medium text-gray-700">Размер:</span>
            <input
              type="range"
              min="10"
              max="40"
              value={markerSize}
              onChange={(e) => onMarkerSizeChange(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-12">{markerSize}px</span>
          </div>
        </div>

        {/* Подсказки */}
        {markerColor === 'underline' && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Icon name="Info" className="text-green-600" size={16} />
              <span className="text-sm text-green-800">
                {underlineStart 
                  ? 'Кликните в конечную точку подчеркивания' 
                  : 'Кликните в начальную точку подчеркивания'}
              </span>
            </div>
          </div>
        )}

        {/* Действия */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={onClear}>
            <Icon name="RotateCcw" className="mr-1" size={14} />
            Очистить разметку
          </Button>
          <Button 
            size="sm" 
            className="ml-auto bg-green-600 hover:bg-green-700"
            onClick={onClose}
          >
            <Icon name="Check" className="mr-1" size={14} />
            Готово
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckModal;
