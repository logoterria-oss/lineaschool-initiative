import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import { formatSavedAt } from '@/hooks/useFormDraft';

interface Props {
  open: boolean;
  savedAt: string;
  childName: string;
  /** Продолжить заполнение */
  onRestore: () => void;
  /** Начать заново */
  onDiscard: () => void;
}

/** Предложение продолжить с места, где логопед остановился */
export default function RestoreDraftDialog({
  open,
  savedAt,
  childName,
  onRestore,
  onDiscard,
}: Props) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon name="RotateCcw" size={20} className="shrink-0 text-blue-500" />
            Продолжить заполнение?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                Осталась незаконченная диагностика
                {childName ? (
                  <>
                    {' '}
                    — <span className="font-semibold text-gray-900">{childName}</span>
                  </>
                ) : null}
                .
              </p>
              <p className="text-xs text-gray-500">Сохранено {formatSavedAt(savedAt)}.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard}>Начать заново</AlertDialogCancel>
          <AlertDialogAction onClick={onRestore}>Продолжить</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
