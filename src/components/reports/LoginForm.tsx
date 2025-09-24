import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LoginFormProps {
  password: string;
  setPassword: (password: string) => void;
  loading: boolean;
  error: string;
  onAuthenticate: () => void;
}

export default function LoginForm({ password, setPassword, loading, error, onAuthenticate }: LoginFormProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
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
  );
}