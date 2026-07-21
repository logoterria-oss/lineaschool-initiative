import Icon from '@/components/ui/icon';

const StubView = ({ label }: { label: string }) => (
  <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Icon name="Hammer" size={26} className="text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-700 mb-1">{label}</h3>
    <p className="text-gray-400 text-sm">Раздел в разработке — скоро заполним.</p>
  </div>
);

export default StubView;
