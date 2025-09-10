export const translateValue = (value: string) => {
  if (!value) return 'Не указано';
  
  const translations: Record<string, string> = {
    // Тип образования
    'general': 'Общее',
    'special': 'Специальное',
    'inclusive': 'Инклюзивное',
    
    // Ведущая рука
    'right': 'Правая',
    'left': 'Левая',
    'ambidextrous': 'Обе руки',
    
    // Класс обучения
    'regular': 'Общеобразовательный',
    'correctional': 'Коррекционный',
    
    // Детский сад
    'attended': 'Посещал',
    'not_attended': 'Не посещал',
    
    // АООП
    'aoop_1': 'АООП НОО ОВЗ вариант 1',
    'aoop_2': 'АООП НОО ОВЗ вариант 2',
    'none': 'Не требуется',
    
    // Общие значения
    'yes': 'Да',
    'no': 'Нет',
    'unknown': 'Неизвестно',
    'without_features': 'Без особенностей',
    'present': 'Имеются',
    'absent': 'Отсутствуют',
    
    // Для речевой среды
    'нет': 'Без особенностей'
  };
  
  return translations[value] || value;
};

export const formatList = (items: string[]) => {
  if (!items || !Array.isArray(items)) return 'Не указано';
  return items.length > 0 ? items.map(translateValue).join(', ') : 'Не указано';
};

export const formatValue = (value: string | string[]) => {
  if (!value) return 'Не указано';
  if (Array.isArray(value)) {
    return formatList(value);
  }
  return translateValue(value) || 'Не указано';
};

export const testLocalStorage = () => {
  try {
    const testKey = 'test_storage';
    const testValue = 'test_value';
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    if (retrieved === testValue) {
      alert('localStorage работает корректно. Попробуйте заполнить форму заново.');
    } else {
      alert('localStorage не работает. Проверьте настройки приватности браузера.');
    }
  } catch (e) {
    alert(`localStorage заблокирован: ${e instanceof Error ? e.message : 'Неизвестная ошибка'}`);
  }
};