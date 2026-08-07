import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { MarkerColor } from '../types';

interface CheckModalToolbarProps {
  markerColor: MarkerColor;
  markerSize: number;
  underlineStart: { x: number; y: number } | null;
  hasMarkup: boolean;
  onMarkerColorChange: (color: MarkerColor) => void;
  onMarkerSizeChange: (size: number) => void;
  onClear: () => void;
  onSave: () => void;
}

const CheckModalToolbar = ({
  markerColor,
  markerSize,
  underlineStart,
  hasMarkup,
  onMarkerColorChange,
  onMarkerSizeChange,
  onClear,
  onSave
}: CheckModalToolbarProps) => {
  return (
    <div className="bg-white border-t shadow-sm p-4">
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700 mr-2">Инструменты:</span>
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
            Орфографические
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

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Размер:</span>
          <input
            type="range"
            min="10"
            max="40"
            value={markerSize}
            onChange={(e) => onMarkerSizeChange(Number(e.target.value))}
            className="flex-1 max-w-xs"
          />
          <span className="text-sm text-gray-600 w-12">{markerSize}px</span>
        </div>

        {markerColor === 'underline' && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-2">
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

        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onClear}>
            <Icon name="RotateCcw" className="mr-1" size={14} />
            Сбросить проверку
          </Button>
          <Button 
            size="sm" 
            className="ml-auto bg-green-600 hover:bg-green-700"
            onClick={onSave}
            disabled={!hasMarkup}
          >
            <Icon name="Save" className="mr-1" size={14} />
            Сохранить проверку
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckModalToolbar;