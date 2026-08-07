import { useState } from 'react';
import Icon from '@/components/ui/icon';

const Instructions = () => {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setShowInstructions(!showInstructions)}
        className="w-full p-4 flex items-center justify-between hover:bg-blue-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon name="Info" className="text-blue-600" size={16} />
          <span className="font-semibold text-blue-900">Как размечать?</span>
        </div>
        <Icon 
          name={showInstructions ? "ChevronUp" : "ChevronDown"} 
          className="text-blue-600" 
          size={20} 
        />
      </button>
      {showInstructions && (
        <div className="px-4 pb-4">
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
            <li>Зелёным выделяйте дисграфические ошибки (нарушения письма)</li>
            <li>Красным выделяйте орфографические ошибки</li>
            <li>Ластик поможет убрать лишние выделения</li>
            <li>После разметки нажмите "Сохранить разметку"</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Instructions;