import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface AdminHeaderProps {
  showForm: boolean;
  onToggleForm: () => void;
  onRefresh: () => void;
}

export default function AdminHeader({ showForm, onToggleForm, onRefresh }: AdminHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold">Логопедические заключения</h1>
        <p className="text-gray-600">Управление базой данных заключений</p>
      </div>
      <div className="flex gap-2">
        <Button onClick={onRefresh} variant="outline" size="sm">
          <Icon name="RefreshCw" size={16} className="mr-2" />
          Обновить
        </Button>
        <Button onClick={() => window.location.href = '/diag_form'}>+ первичная диагностика</Button>
        <Button
          variant="secondary"
          onClick={() => alert('Промежуточная диагностика скоро будет доступна')}
        >
          + промежуточная диагностика
        </Button>
      </div>
    </div>
  );
}