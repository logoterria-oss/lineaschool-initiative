import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { confirmEmail, verifyEmailCode, resendCode } from '@/lib/staffApi';

interface Props {
  phone: string;
  crmEmail: string;
  onClose: () => void;
  onVerified: () => void;
}

const inputCls =
  'w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white shadow-sm';

const EmailVerifyModal = ({ phone, crmEmail, onClose, onVerified }: Props) => {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState(crmEmail || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const r = await confirmEmail(phone, email.trim());
      if (r.ok) {
        setStep('code');
        setInfo(r.data.message || `Код отправлен на ${email}`);
      } else {
        setError(r.data.message || 'Не удалось отправить код');
      }
    } catch {
      setError('Ошибка сети, попробуйте ещё раз');
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setError('');
    setLoading(true);
    try {
      const r = await verifyEmailCode(phone, code.trim());
      if (r.ok) {
        onVerified();
      } else {
        setError(r.data.message || 'Неверный код');
      }
    } catch {
      setError('Ошибка сети, попробуйте ещё раз');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const r = await resendCode(phone);
      setInfo(r.ok ? (r.data.message || 'Новый код отправлен') : (r.data.message || 'Не удалось отправить'));
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Icon name="Mail" size={20} className="text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Подтверждение почты</h3>
        </div>

        {step === 'email' ? (
          <>
            <p className="text-sm text-gray-500 mb-3">
              {crmEmail
                ? 'Мы нашли вашу почту в CRM. Проверьте, что она актуальна, — на неё придёт код.'
                : 'Укажите email — на него придёт код подтверждения.'}
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="email@example.com"
              autoFocus
              className={inputCls}
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button
              onClick={sendCode}
              disabled={loading}
              className="w-full mt-3 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Отправляю…' : 'Отправить код'}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-3">
              Введите 6-значный код, отправленный на <b>{email}</b>.
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && verify()}
              placeholder="000000"
              autoFocus
              className={`${inputCls} text-center text-lg tracking-[0.4em]`}
            />
            {info && <p className="text-green-600 text-sm mt-2">{info}</p>}
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button
              onClick={verify}
              disabled={loading || code.length !== 6}
              className="w-full mt-3 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Проверяю…' : 'Подтвердить'}
            </button>
            <div className="flex items-center justify-between mt-3 text-sm">
              <button onClick={() => setStep('email')} className="text-gray-500 hover:text-gray-700">
                Изменить почту
              </button>
              <button onClick={resend} disabled={loading} className="text-green-700 hover:text-green-800 font-medium">
                Отправить код заново
              </button>
            </div>
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

export default EmailVerifyModal;
