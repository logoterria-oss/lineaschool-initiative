import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';

interface LoginFormProps {
  password: string;
  setPassword: (password: string) => void;
  loading: boolean;
  error: string;
  onAuthenticate: () => void;
}

export default function LoginForm({ password, setPassword, loading, error, onAuthenticate }: LoginFormProps) {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img 
                src="https://cdn.poehali.dev/files/13a5c25b-412b-4a65-a320-ddc9ab10719f.png" 
                alt="Linea School" 
                className="w-8 h-8"
              />
              <span className="font-semibold text-gray-900">Linea School</span>
            </button>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
            >
              <Icon name="Home" className="mr-2" size={18} />
              На главную
            </Button>
          </div>
        </div>
      </header>
      
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Администрирование заключений</CardTitle>
          <CardDescription className="text-center">
            Введите пароль для доступа к системе
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onAuthenticate()}
              placeholder="Введите пароль"
            />
          </div>
          <Button 
            onClick={onAuthenticate} 
            disabled={loading} 
            className="w-full"
          >
            {loading ? 'Проверка...' : 'Войти'}
          </Button>
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}