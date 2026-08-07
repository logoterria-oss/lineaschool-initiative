import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface SaveConfirmModalProps {
  greenCount: number;
  redCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const SaveConfirmModal = ({ greenCount, redCount, onConfirm, onCancel }: SaveConfirmModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-start gap-3 mb-4">
          <Icon name="AlertTriangle" className="text-yellow-600 mt-0.5 flex-shrink-0" size={24} />
          <div>
            <h3 className="font-semibold text-lg text-gray-900">Подтверждение сохранения</h3>
            <p className="text-sm text-gray-600 mt-2">
              Найдено ошибок: <strong>{greenCount + redCount}</strong>
            </p>
            <p className="text-sm text-gray-600">
              Дисграфия: <span className="text-green-600 font-semibold">{greenCount}</span>, 
              Орфографические: <span className="text-red-600 font-semibold">{redCount}</span>
            </p>
            <p className="text-sm text-gray-700 mt-3">
              После сохранения маркеры будут объединены с изображением, и редактор закроется.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button 
            onClick={onCancel} 
            size="sm"
            variant="outline"
          >
            Отмена
          </Button>
          <Button 
            onClick={onConfirm} 
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Icon name="Check" className="mr-1" size={14} />
            Да, сохранить
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SaveConfirmModal;