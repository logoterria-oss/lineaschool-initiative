import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { choiceKey } from '@/components/booking/DayCard';
import type { ChosenItem } from '@/components/booking/BookingSummary';

const Card = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md text-center">{children}</div>
  </div>
);

export const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center text-gray-500">
      <Icon name="Loader2" size={36} className="animate-spin mx-auto mb-3" />
      Загружаем…
    </div>
  </div>
);

export const NetFailedScreen = ({ loading, onRetry }: { loading: boolean; onRetry: () => void }) => (
  <Card>
    <Icon name="WifiOff" size={40} className="mx-auto mb-4 text-gray-400" />
    <h1 className="text-xl font-semibold text-gray-800 mb-2">Не удалось загрузить страницу</h1>
    <p className="text-gray-500 text-sm mb-5">
      Похоже, проблема со связью. Ссылка в порядке — попробуйте ещё раз.
    </p>
    <Button onClick={onRetry} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
      <Icon name={loading ? 'Loader2' : 'RefreshCw'} size={16} className={loading ? 'animate-spin mr-2' : 'mr-2'} />
      Повторить
    </Button>
  </Card>
);

export const InvalidLinkScreen = ({ error }: { error: string }) => (
  <Card>
    <Icon name="LinkOff" fallback="Link2Off" size={40} className="mx-auto mb-4 text-gray-400" />
    <h1 className="text-xl font-semibold text-gray-800 mb-2">Ссылка недействительна</h1>
    <p className="text-gray-500 text-sm">{error || 'Напишите администратору за новой ссылкой.'}</p>
  </Card>
);

export const DoneScreen = ({ chosen, startFrom }: { chosen: ChosenItem[]; startFrom: string }) => (
  <Card>
    <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
      <Icon name="Check" size={28} className="text-emerald-600" />
    </div>
    <h1 className="text-xl font-semibold text-gray-800 mb-3">
      {chosen.length > 1 ? 'Занятия забронированы' : 'Время забронировано'}
    </h1>
    <div className="space-y-2 mb-3">
      {chosen.map(({ pick: p, type }) => (
        <p key={choiceKey(p)} className="text-gray-700">
          {p.weekdayName} в {p.timeFrom}–{p.timeTo}
          <br />
          <span className="text-gray-500 text-sm">
            {type === 'groups' ? 'группа' : 'индивидуально'}, педагог {p.teacherName}
          </span>
        </p>
      ))}
    </div>
    {/* Дата начала одна на все выбранные занятия */}
    <p className="text-gray-600 text-sm mb-3">
      Начало занятий с {startFrom.split('-').reverse().join('.')}
    </p>
    <p className="text-gray-500 text-sm">Администратор свяжется с вами, чтобы подтвердить занятие.</p>
  </Card>
);

export const LimitReachedScreen = () => (
  <Card>
    <Icon name="CalendarCheck" size={36} className="mx-auto mb-3 text-emerald-600" />
    <h2 className="font-semibold text-gray-800 mb-1">Занятие уже забронировано</h2>
    <p className="text-gray-500 text-sm">
      По этой ссылке запись уже сделана. Если нужно перенести — напишите администратору.
    </p>
  </Card>
);
