import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface Props {
  undone: number;
  total: number;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

/** Предупреждение при закрытии смены с невыполненными задачами */
const CloseShiftDialog = ({ undone, total, onCancel, onConfirm }: Props) => {
  const [reason, setReason] = useState('');

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Icon name="TriangleAlert" size={20} className="text-amber-600" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900">Не все задачи отмечены</div>
            <div className="text-sm text-gray-600 mt-1">
              Осталось {undone} из {total}. Смену закрыть можно, но напишите руководителю, что
              помешало — это уйдёт вместе с чек-листом.
            </div>
          </div>
        </div>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Что помешало выполнить задачи"
          className="mt-4 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-y"
        />

        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1 rounded-xl">
            Вернуться к задачам
          </Button>
          <Button
            onClick={() => onConfirm(reason.trim())}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
          >
            Всё равно закрыть
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CloseShiftDialog;
