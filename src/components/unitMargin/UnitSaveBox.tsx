import Icon from '@/components/ui/icon';

interface Props {
  note: string;
  onNoteChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}

/** Комментарий к расчёту и кнопка сохранения месяца. */
export default function UnitSaveBox({ note, onNoteChange, onSave, saving }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <label className="block text-xs text-gray-500 mb-1">Комментарий</label>
      <input
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="что проверяли, какие допущения"
        className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
      <button
        onClick={onSave}
        disabled={saving}
        className="mt-3 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
      >
        <Icon
          name={saving ? 'Loader2' : 'Save'}
          size={17}
          className={saving ? 'animate-spin' : ''}
        />
        Сохранить расчёт месяца
      </button>
      <p className="text-xs text-gray-400 mt-2">
        Сохранённый расчёт фиксирует цифры этого месяца — по ним потом
        строится динамика.
      </p>
    </div>
  );
}
