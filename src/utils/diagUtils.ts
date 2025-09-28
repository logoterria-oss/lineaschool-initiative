export const translateValue = (value: string) => {
  if (!value) return 'Не указано';
  
  const translations: Record<string, string> = {
    // Тип образования
    'в образовательной организации (школа, лицей, гимназия)': 'в общеобразовательной школе',
    'в образовательной организации (коррекционная школа)': 'в специальной (коррекционной) школе',
    'семейное образование': 'семейное образование',
    'school': 'в общеобразовательной школе',
    'special': 'в специальной (коррекционной) школе',
    'homeschool': 'семейное образование',
    'general': 'в общеобразовательной школе',
    'inclusive': 'в общеобразовательной школе',
    
    // Ведущая рука
    'right': 'правша',
    'left': 'левша',
    'retrained': 'правша (переученный левша)',
    'ambidextrous': 'обе руки',
    'Правша (переученный левша)': 'Правша (переученный левша)',
    'retrained_left': 'Правша (переученный левша)',
    
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
    'нет': 'без особенностей',
    'unknown': 'Неизвестно',
    'without_features': 'Без особенностей',
    'present': 'Имеются',
    'absent': 'Отсутствуют',
    'нет /не диагностировано': 'нет /не диагностировано',
    'не диагностировано': 'нет /не диагностировано',
    
    // Для речевой среды (специальное правило)
    'speechEnvironmentNo': 'Без особенностей'
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

// Специальная функция для анамнестических данных
export const formatAnamnesticsValue = (value: string | string[], isCustom: boolean, customValue?: string) => {
  if (isCustom) {
    return customValue || 'Не указано';
  }
  
  if (!value) return 'Не указано';
  
  // Для анамнестических данных сохраняем точный текст для определенных значений
  if (value === 'нет /не диагностировано' || value === 'не диагностировано') {
    return 'нет /не диагностировано';
  }
  
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