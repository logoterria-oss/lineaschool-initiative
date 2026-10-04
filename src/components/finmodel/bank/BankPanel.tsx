import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { BankData, fetchBank } from '@/lib/bankApi';
import BankSources from './BankSources';
import BankOperations from './BankOperations';
import BankRules from './BankRules';
import BankManualFacts from './BankManualFacts';

interface Props {
  onModelChanged: () => void;
}

const BankPanel = ({ onModelChanged }: Props) => {
  const [data, setData] = useState<BankData | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async (month?: string) => {
    try {
      setData(await fetchBank(month));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changed = async () => {
    await load(data?.month);
    onModelChanged();
  };

  if (error) return <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm">{error}</div>;
  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
        <Icon name="Loader2" size={26} className="animate-spin mx-auto mb-2" />
        Загружаем банковские операции…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BankSources data={data} onChanged={changed} />
      <BankOperations data={data} onMonth={(m) => load(m)} onChanged={changed} />
      <BankRules data={data} onChanged={changed} />
      <BankManualFacts key={data.manual.length} data={data} onChanged={changed} />
    </div>
  );
};

export default BankPanel;
