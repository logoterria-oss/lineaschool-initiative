import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

interface Conversation {
  id: number;
  first_name: string;
  telegram_username: string;
  assigned_to: string;
  status: string;
  created_at: string;
  updated_at: string;
  lead_data?: any;
}

interface Message {
  id: number;
  sender: string;
  message_text: string;
  sent_at: string;
}

interface AdminSettings {
  available_slots: string;
  questionnaire_link: string;
  zoom_link: string;
}

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [settings, setSettings] = useState<AdminSettings>({
    available_slots: '',
    questionnaire_link: 'lineaschool.ru/anketa',
    zoom_link: 'https://us06web.zoom.us/j/6730451509'
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (password === 'linea2024') {
      setIsAuthenticated(true);
      loadConversations();
    } else {
      alert('Неверный пароль');
    }
  };

  const loadConversations = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/903d39bc-07b8-462d-92da-a1922db341aa?endpoint=ai_manager');
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Ошибка загрузки диалогов:', error);
    }
  };

  const loadMessages = async (conversationId: number) => {
    try {
      const response = await fetch(`https://functions.poehali.dev/903d39bc-07b8-462d-92da-a1922db341aa?endpoint=ai_manager&conversation_id=${conversationId}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    }
  };

  const selectConversation = (id: number) => {
    setSelectedConversation(id);
    loadMessages(id);
  };

  const takeControl = async (conversationId: number) => {
    try {
      await fetch('https://functions.poehali.dev/903d39bc-07b8-462d-92da-a1922db341aa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'take_control',
          conversation_id: conversationId
        })
      });
      loadConversations();
      alert('Управление перехвачено! AI больше не будет отвечать в этом диалоге.');
    } catch (error) {
      console.error('Ошибка перехвата управления:', error);
    }
  };

  const releaseControl = async (conversationId: number) => {
    try {
      await fetch('https://functions.poehali.dev/903d39bc-07b8-462d-92da-a1922db341aa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'release_control',
          conversation_id: conversationId
        })
      });
      loadConversations();
      alert('Управление возвращено AI');
    } catch (error) {
      console.error('Ошибка возврата управления:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      await fetch('https://functions.poehali.dev/903d39bc-07b8-462d-92da-a1922db341aa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          conversation_id: selectedConversation,
          message: newMessage
        })
      });
      setNewMessage('');
      loadMessages(selectedConversation);
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      await fetch('https://functions.poehali.dev/903d39bc-07b8-462d-92da-a1922db341aa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_settings',
          settings: settings
        })
      });
      alert('Настройки сохранены!');
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
    } finally {
      setLoading(false);
    }
  };

  const stopAllAI = async () => {
    if (!confirm('Остановить AI во всех активных диалогах?')) return;
    
    setLoading(true);
    try {
      await fetch('https://functions.poehali.dev/903d39bc-07b8-462d-92da-a1922db341aa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop_all_ai' })
      });
      loadConversations();
      alert('AI остановлен во всех диалогах');
    } catch (error) {
      console.error('Ошибка остановки AI:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Lock" size={24} />
              Вход в админ-панель
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Button onClick={handleLogin} className="w-full">
              Войти
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Icon name="Settings" size={32} />
                Админ-панель LineaSchool
              </h1>
              <p className="text-gray-600 mt-2">Управление AI-менеджером и диалогами</p>
            </div>
            <Button onClick={stopAllAI} variant="destructive" disabled={loading}>
              <Icon name="StopCircle" size={18} className="mr-2" />
              Остановить всех AI
            </Button>
          </div>
        </div>

        <Tabs defaultValue="conversations" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="conversations">
              <Icon name="MessageSquare" size={16} className="mr-2" />
              Диалоги
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Icon name="Settings" size={16} className="mr-2" />
              Настройки AI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversations" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Активные диалоги</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => selectConversation(conv.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedConversation === conv.id
                          ? 'bg-purple-100 border-purple-300'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{conv.first_name}</span>
                        {conv.assigned_to === 'manual' ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            Вы
                          </span>
                        ) : (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            AI
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{conv.telegram_username}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(conv.updated_at).toLocaleString('ru-RU')}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {selectedConv ? selectedConv.first_name : 'Выберите диалог'}
                    </CardTitle>
                    {selectedConv && (
                      <div className="flex gap-2">
                        {selectedConv.assigned_to === 'ai' ? (
                          <Button
                            size="sm"
                            onClick={() => takeControl(selectedConv.id)}
                            variant="outline"
                          >
                            <Icon name="UserCheck" size={16} className="mr-2" />
                            Перехватить
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => releaseControl(selectedConv.id)}
                            variant="outline"
                          >
                            <Icon name="Bot" size={16} className="mr-2" />
                            Вернуть AI
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedConversation ? (
                    <>
                      <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-3 rounded-lg ${
                              msg.sender === 'user'
                                ? 'bg-gray-100 ml-12'
                                : 'bg-purple-100 mr-12'
                            }`}
                          >
                            <div className="text-xs text-gray-500 mb-1">
                              {msg.sender === 'user' ? 'Клиент' : msg.sender === 'manual' ? 'Вы' : 'AI'} •{' '}
                              {new Date(msg.sent_at).toLocaleTimeString('ru-RU')}
                            </div>
                            <div className="text-gray-800">{msg.message_text}</div>
                          </div>
                        ))}
                      </div>

                      {selectedConv?.assigned_to === 'manual' && (
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Введите сообщение..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="min-h-[80px]"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                          />
                          <Button onClick={sendMessage}>
                            <Icon name="Send" size={18} />
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-gray-500 py-12">
                      <Icon name="MessageSquare" size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Выберите диалог из списка слева</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Настройки AI-менеджера</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Icon name="Calendar" size={16} className="inline mr-2" />
                    Доступные слоты для диагностики
                  </label>
                  <Textarea
                    placeholder="Например: 5 декабря 14:00, 6 декабря 10:00, 7 декабря 16:00"
                    value={settings.available_slots}
                    onChange={(e) => setSettings({ ...settings, available_slots: e.target.value })}
                    className="min-h-[120px]"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    AI будет предлагать эти слоты родителям
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Icon name="FileText" size={16} className="inline mr-2" />
                    Ссылка на анкету
                  </label>
                  <Input
                    value={settings.questionnaire_link}
                    onChange={(e) => setSettings({ ...settings, questionnaire_link: e.target.value })}
                    placeholder="lineaschool.ru/anketa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Icon name="Video" size={16} className="inline mr-2" />
                    Ссылка на Zoom-конференцию
                  </label>
                  <Input
                    value={settings.zoom_link}
                    onChange={(e) => setSettings({ ...settings, zoom_link: e.target.value })}
                    placeholder="https://us06web.zoom.us/j/6730451509"
                  />
                </div>

                <Button onClick={saveSettings} disabled={loading} className="w-full">
                  {loading ? 'Сохранение...' : 'Сохранить настройки'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}