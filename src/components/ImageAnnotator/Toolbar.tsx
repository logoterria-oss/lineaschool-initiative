import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { MarkerColor } from './types';

interface ToolbarProps {
  markerColor: MarkerColor;
  markerSize: number;
  underlineStart: { x: number; y: number } | null;
  hasMarkup: boolean;
  onMarkerColorChange: (color: MarkerColor) => void;
  onMarkerSizeChange: (size: number) => void;
  onOpenCheckModal: () => void;
  onSave: () => void;
  onClear: () => void;
  onRotate: () => void;
}

const Toolbar = ({
  markerColor,
  markerSize,
  underlineStart,
  hasMarkup,
  onMarkerColorChange,
  onMarkerSizeChange,
  onOpenCheckModal,
  onSave,
  onClear,
  onRotate
}: ToolbarProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={markerColor === 'green' ? 'default' : 'outline'}
            onClick={() => onMarkerColorChange('green')}
            className={markerColor === 'green' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            <Icon name="Circle" className="mr-1" size={14} />
            Дисграфия
          </Button>
          <Button
            size="sm"
            variant={markerColor === 'red' ? 'default' : 'outline'}
            onClick={() => onMarkerColorChange('red')}
            className={markerColor === 'red' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            <Icon name="Circle" className="mr-1" size={14} />
            Орфография
          </Button>
          <Button
            size="sm"
            variant={markerColor === 'underline' ? 'default' : 'outline'}
            onClick={() => onMarkerColorChange('underline')}
            className={markerColor === 'underline' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            <Icon name="Minus" className="mr-1" size={14} />
            Подчеркнуть
          </Button>
          <Button
            size="sm"
            variant={markerColor === 'eraser' ? 'default' : 'outline'}
            onClick={() => onMarkerColorChange('eraser')}
            className={markerColor === 'eraser' ? 'bg-gray-600 hover:bg-gray-700' : ''}
          >
            <Icon name="Eraser" className="mr-1" size={14} />
            Ластик
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={markerColor === 'crop' ? 'default' : 'outline'}
            onClick={() => onMarkerColorChange('crop')}
            className={markerColor === 'crop' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            <Icon name="Crop" className="mr-1" size={14} />
            Кадрировать
          </Button>
          <Button 
            onClick={onRotate} 
            size="sm"
            variant="outline"
            title="Повернуть изображение на 90°"
          >
            <Icon name="RotateCw" className="mr-1" size={14} />
            Повернуть
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Размер:</span>
          <input
            type="range"
            min="10"
            max="40"
            value={markerSize}
            onChange={(e) => onMarkerSizeChange(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-sm text-gray-600">{markerSize}px</span>
        </div>

        <div className="flex gap-2 ml-auto">
          {hasMarkup && (
            <>
              <Button 
                onClick={onClear} 
                size="sm"
                variant="outline"
              >
                <Icon name="Trash2" className="mr-1" size={14} />
                Очистить
              </Button>
              <Button 
                onClick={onSave} 
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Icon name="Save" className="mr-1" size={14} />
                Сохранить разметку
              </Button>
            </>
          )}
        </div>
      </div>
      
      {markerColor === 'green' && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Icon name="Info" className="text-green-600" size={16} />
            <span className="text-sm text-green-800">
              Кликните на изображение, чтобы отметить дисграфическую ошибку. Откроется окно выбора типа ошибки.
            </span>
          </div>
        </div>
      )}

      {markerColor === 'red' && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Icon name="Info" className="text-red-600" size={16} />
            <span className="text-sm text-red-800">
              Кликните на изображение, чтобы отметить орфографическую ошибку.
            </span>
          </div>
        </div>
      )}

      {markerColor === 'crop' && (
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Icon name="Info" className="text-blue-600" size={16} />
            <span className="text-sm text-blue-800">
              Зажмите левую кнопку мыши и выделите область для кадрирования
            </span>
          </div>
        </div>
      )}
      
      {markerColor === 'underline' && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Icon name="Info" className="text-green-600" size={16} />
            <span className="text-sm text-green-800">
              {underlineStart ? 'Кликните в конечную точку подчеркивания' : 'Кликните в начальную точку подчеркивания'}
            </span>
          </div>
        </div>
      )}

      {markerColor === 'eraser' && (
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Icon name="Info" className="text-gray-600" size={16} />
            <span className="text-sm text-gray-800">
              Кликните на маркер или подчеркивание, чтобы удалить его
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar;