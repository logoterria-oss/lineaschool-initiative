export function processingColor(status: string): string {
  const map: Record<string, string> = {
    'Списались (ответ не получен)': 'bg-gray-100 text-gray-700',
    'Списались (ответ получен)': 'bg-gray-200 text-gray-800',
    'Заполнена анкета': 'bg-yellow-100 text-yellow-800',
    'Запланирована диагностика (не оплачено)': 'bg-orange-100 text-orange-800',
    'Запланирована диагностика (оплачено)': 'bg-orange-200 text-orange-900',
    'Проведена диагностика': 'bg-cyan-100 text-cyan-800',
    'Утверждено расписание': 'bg-blue-100 text-blue-800',
    'Оплачен абонемент': 'bg-green-200 text-green-900',
    'Клиент добавлен в мессенджер': 'bg-green-100 text-green-800',
  };
  return map[status] || 'bg-gray-50 text-gray-500';
}

export function leadStatusColor(status: string): string {
  const map: Record<string, string> = {
    'лид в работе': 'bg-gray-200 text-gray-800',
    'клиент': 'bg-green-100 text-green-800',
    'нецелевой лид': 'bg-red-100 text-red-700',
    'лид не вышел на связь': 'bg-red-100 text-red-700',
    'норма развития': 'bg-red-100 text-red-700',
    'отказ': 'bg-red-200 text-red-800',
    'игнор': 'bg-yellow-100 text-yellow-800',
  };
  return map[status] || 'bg-gray-50 text-gray-500';
}
