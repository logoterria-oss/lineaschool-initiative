import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { forgotPassword, resetPassword } from '@/lib/staffApi';

interface Props {
  initialPhone?: string;
  onClose: () => void;
  onDone: () => void;
}

const inputCls =
  'w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white shadow-sm';

const ForgotPasswordModal = ({ initialPhone = '', onClose, onDone }: Props) => {
  const [step, setStep] = useState<'phone' | 'reset'>('phone');
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const requestCode = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const r = await forgotPassword(phone.trim());
      if (r.ok) {
        setStep('reset');
        setInfo(r.data.message || 'Если аккаунт существует, код отправлен на почту.');
      } else {
        setError(r.data.message || 'Не удалось отправить код');
      }
    } catch {
      setError('Ошибка сети, попробуйте ещё раз');
    } finally {
      setLoading(false);
    }
  };

  const doReset = async () => {
    setError('');
    setLoading(true);
    try {
      const r = await resetPassword(phone.trim(), code.trim(), newPassword);
      if (r.ok) {
        onDone();
      } else {
        setError(r.data.message || 'Не удалось сменить пароль');
      }
    } catch {
      setError('Ошибка сети, попробуйте ещё раз');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Icon name="KeyRound" size={20} className="text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Восстановление пароля</h3>
        </div>

        {step === 'phone' ? (
          <>
            <p className="text-sm text-gray-500 mb-3">
              Введите телефон аккаунта — код для сброса пароля придёт на вашу почту.
            </p>
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setError(''); }}
              placeholder="Телефон, напр. +7 900 000-00-00"
              autoFocus
              className={inputCls}
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button
              onClick={requestCode}
              disabled={loading}
              className="w-full mt-3 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Отправляю…' : 'Получить код'}
            </button>
          </>
        ) : (
          <>
            {info && <p className="text-green-600 text-sm mb-3">{info}</p>}
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
              placeholder="Код из письма"
              autoFocus
              className={`${inputCls} text-center text-lg tracking-[0.3em] mb-2`}
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
              placeholder="Новый пароль (мин. 6 символов)"
              className={inputCls}
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button
              onClick={doReset}
              disabled={loading || code.length !== 6 || newPassword.length < 6}
              className="w-full mt-3 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Сохраняю…' : 'Сменить пароль'}
            </button>
          </>
        )}

        <button
          onClick={onClose}
          className="w-full mt-3 text-gray-400 hover:text-gray-600 text-sm py-1"
        >
          Отмена
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
