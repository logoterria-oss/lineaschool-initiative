import Icon from '@/components/ui/icon';
import { Choice, GroupDayCard, IndividualDay } from '@/components/booking/DayCard';
import SectionHeader from '@/components/booking/SectionHeader';
import EmptySection from '@/components/booking/EmptySection';
import { FreeDay, GroupDay } from '@/lib/bookingsApi';

interface SectionProps {
  picks: Choice[];
  skipped: boolean;
  open: boolean;
  failed: boolean;
  onSkip: () => void;
  onToggleOpen: () => void;
  onToggle: (choice: Choice) => void;
  onRetry: () => void;
}

export const GroupsSection = ({
  days: groupDays,
  picks,
  skipped,
  open,
  failed,
  onSkip,
  onToggleOpen,
  onToggle,
  onRetry,
}: SectionProps & { days: GroupDay[] }) => {
  // Группы делим на две половины недели: ребёнок обычно берёт по занятию
  // из каждой, чтобы между уроками был перерыв. weekday: 0=ПН..6=ВС
  const GROUP_HALVES = [
    {
      label: '1 половина недели (ПН–СР)',
      days: groupDays.filter((d) => d.weekday <= 2),
    },
    {
      label: '2 половина недели (ЧТ–ВС)',
      days: groupDays.filter((d) => d.weekday >= 3),
    },
  ];

  return (
    <div className="mb-6">
      <SectionHeader
        icon="Users"
        title="Групповые занятия"
        skipLabel="Без групповых"
        skipped={skipped}
        count={picks.length}
        onSkip={onSkip}
        open={open}
        onToggleOpen={onToggleOpen}
      />
      {!skipped && open && (
        <div className="space-y-3">
          {groupDays.length === 0 ? (
            <EmptySection failed={failed} onRetry={onRetry} />
          ) : (
            <>
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <Icon name="Info" size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900">Выберите по 1 занятию из 1 и 2 половины недели</p>
              </div>
              {GROUP_HALVES.map(({ label, days }) =>
                days.length === 0 ? null : (
                  <div key={label} className="space-y-3">
                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide pt-1">
                      {label}
                    </div>
                    {days.map((day) => (
                      <GroupDayCard key={day.date} day={day} selected={picks} onToggle={onToggle} />
                    ))}
                  </div>
                ),
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export const IndividualSection = ({
  days,
  picks,
  skipped,
  open,
  failed,
  onSkip,
  onToggleOpen,
  onToggle,
  onRetry,
}: SectionProps & { days: FreeDay[] }) => (
  <div className="mb-6">
    <SectionHeader
      icon="User"
      title="Индивидуальные занятия"
      skipLabel="Без индивидуальных"
      skipped={skipped}
      count={picks.length}
      onSkip={onSkip}
      open={open}
      onToggleOpen={onToggleOpen}
    />
    {!skipped && open && (
      <div className="space-y-3">
        {days.length === 0 ? (
          <EmptySection failed={failed} onRetry={onRetry} />
        ) : (
          days.map((day) => <IndividualDay key={day.date} day={day} selected={picks} onToggle={onToggle} />)
        )}
      </div>
    )}
  </div>
);
