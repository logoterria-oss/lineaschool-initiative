import Icon from '@/components/ui/icon';

/** Заглушка блока, логика которого ещё настраивается */
const DashStub = ({ text }: { text: string }) => (
  <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-400">
    <Icon name="Hourglass" size={16} />
    {text}
  </div>
);

export default DashStub;
