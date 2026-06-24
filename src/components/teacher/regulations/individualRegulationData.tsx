export const TOC = [
  { id: 'before', label: '1. До занятия' },
  { id: 'plan', label: '2. Идеальный план занятия' },
  { id: 'lesson', label: '3. Проведение занятия' },
  { id: 'dysgraphia', label: '3.1. Коррекция дисграфии', indent: 1 },
  { id: 'speech', label: '3.1.1. Развитие речевых функций', indent: 2 },
  { id: 'pronunciation', label: '3.1.1.1. Коррекция нарушений звукопроизношения', indent: 3 },
  { id: 'phonemic', label: '3.1.1.2. Развитие фонематического восприятия', indent: 3 },
  { id: 'language-analysis', label: '3.1.1.3. Языковой анализ и синтез', indent: 3 },
  { id: 'vocabulary', label: '3.1.1.4. Развитие словаря и грамматического строя речи', indent: 3 },
  { id: 'connected-speech', label: '3.1.1.5. Развитие связной речи', indent: 3 },
  { id: 'visual', label: '3.1.2. Развитие зрительных, зрительно-пространственных и моторных функций', indent: 2 },
  { id: 'dysorthography', label: '3.2. Коррекция дизорфографии', indent: 1 },
  { id: 'dysorth-stages', label: '3.2.1. Этапы работы', indent: 2 },
  { id: 'dysorth-list', label: '3.2.2. Список орфограмм начальной школы', indent: 2 },
  { id: 'dyslexia', label: '3.3. Коррекция дислексии', indent: 1 },
  { id: 'reading-tech', label: '3.3.1. Техника чтения', indent: 2 },
  { id: 'reading-comp', label: '3.3.2. Развитие понимания прочитанного', indent: 2 },
  { id: 'after', label: '4. После занятия' },
  { id: 'alfacrm', label: '4.1. Проведение занятия в AlfaCRM', indent: 1 },
  { id: 'first-lesson', label: '5. Первое занятие с учеником' },
];

export const Placeholder = () => (
  <p className="text-gray-400 italic mt-3 text-sm">Раздел будет добавлен...</p>
);
