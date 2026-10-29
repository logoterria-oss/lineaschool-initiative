import { useState } from 'react';
import { useNavigate } from "@/lib/router-compat";
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { unlockFinModel } from '@/lib/finmodelApi';

const FinModelLock = ({ onUnlock }: { onUnlock: () => void }) => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError('');
    try {
      await unlockFinModel(password);
      onUnlock();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось проверить пароль');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">
            <Icon name="Lock" size={22} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Финансовая модель</h1>
          <p className="text-sm text-gray-500">Введите пароль. На этом устройстве он запомнится на 7 дней.</p>
        </div>
        <div className="relative">
          <Input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            autoFocus
            autoComplete="current-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
          >
            <Icon name={show ? 'EyeOff' : 'Eye'} size={18} />
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={!password || busy}>
          {busy ? <Icon name="Loader2" size={16} className="animate-spin mr-2" /> : null}
          Открыть
        </Button>
        <button type="button" onClick={() => navigate(-1)} className="w-full text-sm text-gray-500 hover:text-gray-800">
          Назад
        </button>
      </form>
    </div>
  );
};

export default FinModelLock;
