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

export interface IncompleteSection {
  /** Заголовок раздела, как он назван в форме */
  title: string;
  /** Что именно не заполнено внутри раздела */
  fields: string[];
  /** id блока на странице — чтобы прокрутить к нему */
  anchor?: string;
}

interface Props {
  open: boolean;
  sections: IncompleteSection[];
  /** Продолжить сохранение как есть */
  onConfirm: () => void;
  /** Вернуться к заполнению */
  onCancel: () => void;
}

/**
 * Предупреждение перед сохранением: показывает, какие разделы
 * остались незаполненными, и даёт вернуться к ним.
 * Сохранение не блокируется — часть данных может быть неизвестна.
 */
export default function IncompleteSectionsDialog({ open, sections, onConfirm, onCancel }: Props) {
  const total = sections.reduce((acc, s) => acc + s.fields.length, 0);

  const goToSection = (anchor?: string) => {
    onCancel();
    if (!anchor) return;
    // Ждём закрытия диалога, иначе прокрутка перебивается его анимацией
    setTimeout(() => {
      const el = document.getElementById(anchor);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon name="TriangleAlert" size={20} className="shrink-0 text-amber-500" />
            Заполнено не всё
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              <p className="text-sm text-gray-600">
                {total === 1
                  ? 'Один пункт остался пустым:'
                  : `Пустых пунктов: ${total}. Вот что не заполнено:`}
              </p>

              <div className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1 text-left">
                {sections.map((s) => (
                  <div key={s.title} className="rounded-md border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                      {s.anchor && (
                        <button
                          type="button"
                          onClick={() => goToSection(s.anchor)}
                          className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Перейти
                        </button>
                      )}
                    </div>
                    <ul className="mt-1.5 space-y-0.5">
                      {s.fields.map((f) => (
                        <li key={f} className="text-xs text-gray-600">
                          • {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-xs text-gray-500">
                Можно сохранить и так — незаполненные пункты просто не попадут в заключение.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Вернуться к заполнению</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Всё равно сохранить</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
