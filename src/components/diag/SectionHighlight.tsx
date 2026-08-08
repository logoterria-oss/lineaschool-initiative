import { ReactNode } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  /** id блока — по нему работает прокрутка из диалога */
  anchor: string;
  /** Пропущенные пункты этого раздела; пустой список — подсветки нет */
  missing?: string[];
  children: ReactNode;
}

/**
 * Подсветка раздела с незаполненными пунктами.
 * Включается после возврата из предупреждения и гаснет сама,
 * как только логопед заполняет поля.
 */
export default function SectionHighlight({ anchor, missing = [], children }: Props) {
  const active = missing.length > 0;

  return (
    <div
      id={anchor}
      className={
        active
          ? 'scroll-mt-24 rounded-lg ring-2 ring-amber-400 ring-offset-2 transition-shadow'
          : 'scroll-mt-24'
      }
    >
      {active && (
        <div className="mb-2 flex items-start gap-2 rounded-t-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
          <Icon name="TriangleAlert" size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-900">
            <span className="font-semibold">Не заполнено: </span>
            {missing.join(', ')}
          </p>
        </div>
      )}
      {children}
    </div>
  );
}
