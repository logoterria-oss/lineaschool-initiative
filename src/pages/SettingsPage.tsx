import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import Icon from '@/components/ui/icon';
import func2url from '../../backend/func2url.json';

const LEAD_PROCESSOR_URL = (func2url as Record<string, string>)['lead-processor'];

const SettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');

  const runTest = async () => {
    setLoading(true);
    setStatus('idle');
    setOutput('Отправляю тестовые сообщения в боты...\n');
    const startedAt = Date.now();
    try {
      const res = await fetch(LEAD_PROCESSOR_URL, { method: 'GET' });
      const elapsed = Date.now() - startedAt;
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        // оставляем как есть
      }
      setStatus(res.ok ? 'ok' : 'error');
      setOutput(
        `HTTP ${res.status} ${res.statusText}\nВремя ответа: ${elapsed} мс\n\n${pretty}`
      );
    } catch (e) {
      const elapsed = Date.now() - startedAt;
      setStatus('error');
      const err = e as Error;
      setOutput(
        `ОШИБКА ЗАПРОСА (${elapsed} мс)\n${err.name}: ${err.message}\n\n` +
          'Если время близко к таймауту — запрос к серверу не успел завершиться.'
      );
    } finally {
      setLoading(false);
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <AdminHeader showOnlyHome />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">

          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => navigate('/admin/role-select')}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div className="p-2 bg-gray-200 rounded-lg">
              <Icon name="Settings" size={24} className="text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Настройки</h1>
              <p className="text-gray-500 text-sm">Диагностика и отладка</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="Bug" size={20} className="text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">Отладочное окно — Telegram-боты</h2>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              Отправляет тестовое сообщение через ботов «Анкеты» и «Лиды» и показывает
              подробный технический результат: статус токена, проверку getMe, время и
              ошибки по каждому получателю.
            </p>

            <button
              onClick={runTest}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              {loading ? (
                <Icon name="Loader2" size={18} className="animate-spin" />
              ) : (
                <Icon name="Send" size={18} />
              )}
              {loading ? 'Тестирую...' : 'Отправить тестовые сообщения'}
            </button>

            {output && (
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {status === 'ok' && (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                        <Icon name="CheckCircle2" size={16} /> Запрос выполнен
                      </span>
                    )}
                    {status === 'error' && (
                      <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
                        <Icon name="XCircle" size={16} /> Есть ошибки
                      </span>
                    )}
                  </div>
                  <button
                    onClick={copyOutput}
                    className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-700 text-sm transition-colors"
                  >
                    <Icon name="Copy" size={14} /> Копировать
                  </button>
                </div>
                <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-4 overflow-auto max-h-96 whitespace-pre-wrap break-words">
{output}
                </pre>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
