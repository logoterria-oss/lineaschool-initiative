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
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            🎯 <strong>Автоматическое сохранение:</strong> Когда родители заполняют диагностическую форму <a href="/diag_form" className="underline hover:text-blue-800">/diag_form</a>, система создает логопедическое заключение с уникальным номером и ссылкой, которые автоматически сохраняются в этой базе данных
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={onRefresh} variant="outline" size="sm">
          <Icon name="RefreshCw" size={16} className="mr-2" />
          Обновить
        </Button>
        <Button onClick={() => window.location.href = '/diag_form'}>+ новая диагностика</Button>
      </div>
    </div>
  );
}