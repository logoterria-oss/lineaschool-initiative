import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface WebhookInfo {
  action: string;
  current_webhook?: string;
  expected_webhook: string;
  is_configured: boolean;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
}

interface BotMessage {
  text: string;
  description: string;
}

interface BotMessages {
  [key: string]: BotMessage;
}

const TelegramSetup = () => {
  const [webhookInfo, setWebhookInfo] = useState<WebhookInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [botMessages, setBotMessages] = useState<BotMessages>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const fetchWebhookInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/340acd65-7b8c-4d90-b296-4399fd69956d?action=getWebhookInfo');
      const data = await response.json();
      setWebhookInfo(data);
    } catch (error) {
      console.error('Error fetching webhook info:', error);
    } finally {
      setLoading(false);
    }
  };

  const setWebhook = async () => {
    setActionLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/340acd65-7b8c-4d90-b296-4399fd69956d?action=setWebhook');
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Вебхук успешно настроен!');
        fetchWebhookInfo();
      } else {
        alert(`❌ Ошибка: ${data.description}`);
      }
    } catch (error) {
      console.error('Error setting webhook:', error);
      alert('❌ Ошибка при настройке вебхука');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteWebhook = async () => {
    if (!confirm('Вы уверены, что хотите удалить вебхук?')) return;
    
    setActionLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/340acd65-7b8c-4d90-b296-4399fd69956d?action=deleteWebhook');
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Вебхук удалён');
        fetchWebhookInfo();
      } else {
        alert(`❌ Ошибка: ${data.description}`);
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
      alert('❌ Ошибка при удалении вебхука');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchBotMessages = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/d32d48c4-7302-4db6-a78e-ee12d18d0063');
      const data = await response.json();
      setBotMessages(data.messages || {});
    } catch (error) {
      console.error('Error fetching bot messages:', error);
    }
  };

  const saveBotMessage = async (key: string, text: string) => {
    setActionLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/d32d48c4-7302-4db6-a78e-ee12d18d0063', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_key: key, message_text: text })
      });
      
      if (response.ok) {
        alert('✅ Текст сообщения обновлён!');
        fetchBotMessages();
        setEditingKey(null);
      } else {
        alert('❌ Ошибка при сохранении');
      }
    } catch (error) {
      console.error('Error saving message:', error);
      alert('❌ Ошибка при сохранении');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhookInfo();
    fetchBotMessages();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Настройка Telegram бота</h1>
          <p className="text-gray-600">Управление вебхуком для приёма диктантов</p>
        </div>

        <div className="bg-white rounded-lg border p-4 md:p-6 mb-4">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-2">Статус вебхука</h2>
              <div className="space-y-2">
                {webhookInfo?.is_configured ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Icon name="CheckCircle" size={20} />
                    <span className="font-medium">Вебхук настроен и работает</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-orange-600">
                    <Icon name="AlertCircle" size={20} />
                    <span className="font-medium">Вебхук не настроен</span>
                  </div>
                )}
              </div>
            </div>
            <Button onClick={fetchWebhookInfo} variant="outline" size="sm">
              <Icon name="RotateCw" size={16} className="mr-2" />
              Обновить
            </Button>
          </div>

          {webhookInfo && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Текущий URL вебхука:</div>
                <div className="font-mono text-sm break-all">
                  {webhookInfo.current_webhook || 'не настроен'}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Ожидаемый URL вебхука:</div>
                <div className="font-mono text-sm break-all text-green-700">
                  {webhookInfo.expected_webhook}
                </div>
              </div>

              {webhookInfo.pending_update_count > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-orange-700">
                    <Icon name="AlertTriangle" size={18} />
                    <span className="font-medium">
                      Необработанных сообщений: {webhookInfo.pending_update_count}
                    </span>
                  </div>
                </div>
              )}

              {webhookInfo.last_error_message && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm text-red-600 mb-1">Последняя ошибка:</div>
                  <div className="text-sm text-red-800">{webhookInfo.last_error_message}</div>
                  {webhookInfo.last_error_date && (
                    <div className="text-xs text-red-600 mt-1">
                      {new Date(webhookInfo.last_error_date * 1000).toLocaleString('ru-RU')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-4">Действия</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={setWebhook}
              disabled={actionLoading}
              className="flex-1"
            >
              <Icon name="Link" size={18} className="mr-2" />
              {webhookInfo?.is_configured ? 'Переустановить вебхук' : 'Установить вебхук'}
            </Button>
            
            {webhookInfo?.current_webhook && (
              <Button
                onClick={deleteWebhook}
                disabled={actionLoading}
                variant="destructive"
                className="flex-1"
              >
                <Icon name="Trash2" size={18} className="mr-2" />
                Удалить вебхук
              </Button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4 md:p-6 mt-6">
          <h2 className="text-lg md:text-xl font-semibold mb-4">Тексты сообщений бота</h2>
          <div className="space-y-4">
            {Object.entries(botMessages).map(([key, message]) => (
              <div key={key} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">{message.description}</div>
                    <div className="text-xs text-gray-500 font-mono">{key}</div>
                  </div>
                  {editingKey === key ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => saveBotMessage(key, editText)}
                        disabled={actionLoading}
                      >
                        <Icon name="Check" size={16} className="mr-1" />
                        Сохранить
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingKey(null);
                          setEditText('');
                        }}
                        disabled={actionLoading}
                      >
                        Отмена
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingKey(key);
                        setEditText(message.text);
                      }}
                    >
                      <Icon name="Pencil" size={16} className="mr-1" />
                      Изменить
                    </Button>
                  )}
                </div>
                {editingKey === key ? (
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={5}
                    className="font-mono text-sm"
                  />
                ) : (
                  <div className="bg-gray-50 rounded p-3 text-sm whitespace-pre-wrap font-mono">
                    {message.text}
                  </div>
                )}
                {key === 'success' && (
                  <div className="mt-2 text-xs text-gray-500">
                    Доступные переменные: {'{parent_name}'}, {'{child_name}'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Icon name="Info" size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-2">Как отправить диктант:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Откройте бота в Telegram</li>
                <li>Прикрепите фото диктанта</li>
                <li>В подписи к фото укажите имя родителя (1 строка) и имя ребёнка (2 строка)</li>
                <li>Отправьте сообщение</li>
              </ol>
              <p className="mt-2 text-xs">Диктант автоматически появится в списке для проверки</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramSetup;