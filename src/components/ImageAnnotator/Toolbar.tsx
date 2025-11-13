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
          <Button 
            onClick={onOpenCheckModal} 
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Icon name="CheckCircle" className="mr-1" size={14} />
            Проверить диктант
          </Button>
          {hasMarkup && (
            <Button 
              onClick={onSave} 
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Icon name="Save" className="mr-1" size={14} />
              Сохранить разметку
            </Button>
          )}
        </div>
      </div>
      


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
    </div>
  );
};

export default Toolbar;