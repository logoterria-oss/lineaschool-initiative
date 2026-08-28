import Icon from '@/components/ui/icon';

interface Props {
  icon: string;
  title: string;
  skipLabel: string;
  skipped: boolean;
  onSkip: () => void;
}

/** Заголовок раздела с кнопкой отказа: «Без индивидуальных» / «Без групповых» */
const SectionHeader = ({ icon, title, skipLabel, skipped, onSkip }: Props) => (
  <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
    <div className="flex items-center gap-2">
      <Icon name={icon} size={18} className="text-emerald-700" />
      <h2 className="text-lg font-bold text-gray-800">{title}</h2>
    </div>
    <button
      type="button"
      onClick={onSkip}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
        skipped
          ? 'bg-gray-700 border-gray-700 text-white'
          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
      }`}
    >
      <Icon name={skipped ? 'Check' : 'X'} size={14} />
      {skipLabel}
    </button>
  </div>
);

export default SectionHeader;
