export type LessonForm = 'group' | 'individual';

export interface ChecklistItem {
  key: string;
  criterion: string;
  max: number;
}

export interface ChecklistGroup {
  group: string;
  items: ChecklistItem[];
}

export interface TeacherOption {
  id: number;
  name: string;
}

export const GROUP_TEACHERS: TeacherOption[] = [
  { id: 20, name: 'Канкулова Екатерина' },
  { id: 15, name: 'Мацвей Екатерина' },
];

export const INDIVIDUAL_TEACHERS: TeacherOption[] = [
  { id: 4, name: 'Еремина Дарья' },
  { id: 18, name: 'Карамова Анна' },
  { id: 11, name: 'Камнева Валерия' },
  { id: 2, name: 'Шишаева Анастасия' },
];

export const TEACHERS_BY_FORM: Record<LessonForm, TeacherOption[]> = {
  group: GROUP_TEACHERS,
  individual: INDIVIDUAL_TEACHERS,
};

const GROUP_CHECKLIST: ChecklistGroup[] = [
  {
    group: 'Техническая часть',
    items: [
      { key: 'g_internet', criterion: 'Стабильный интернет', max: 1 },
      { key: 'g_noise', criterion: 'Отсутствие постороннего шума', max: 1 },
      { key: 'g_duration', criterion: 'Длительность урока не менее 40 мин', max: 2 },
      { key: 'g_fullscreen', criterion: 'Материал на весь экран', max: 1 },
      { key: 'g_sound', criterion: 'Качество звука', max: 1 },
      { key: 'g_background', criterion: 'Фон', max: 1 },
    ],
  },
  {
    group: 'Методическая часть',
    items: [
      { key: 'g_topic', criterion: 'Заполнение темы соответствует структуре урока', max: 1 },
      { key: 'g_explain', criterion: 'Правильное объяснение задания для учеников', max: 2 },
      { key: 'g_adapt', criterion: 'Адаптация заданий возрасту и способностям ученика', max: 3 },
      { key: 'g_structure', criterion: 'Четкая структура урока', max: 1 },
      { key: 'g_timing', criterion: 'Соответствие таймингам', max: 2 },
      { key: 'g_goals', criterion: 'Задачи урока достигнуты', max: 5 },
      { key: 'g_control', criterion: 'Контроль за выполнением задания', max: 2 },
      { key: 'g_order', criterion: 'Дети сами следят за очередностью', max: 2 },
      { key: 'g_written', criterion: 'Проверка письменного задания (если оно есть)', max: 1 },
      { key: 'g_homework', criterion: 'Домашнее задание', max: 2 },
      { key: 'g_feedback', criterion: 'Обратная связь', max: 2 },
    ],
  },
  {
    group: 'Индивидуальные параметры',
    items: [
      { key: 'g_contact', criterion: 'Контакт с учениками и дисциплина', max: 1 },
      { key: 'g_distractions', criterion: 'Отсутствие посторонних действий', max: 1 },
      { key: 'g_speech', criterion: 'Правильная речь педагога', max: 1 },
      { key: 'g_appearance', criterion: 'Внешний вид', max: 1 },
    ],
  },
];

const INDIVIDUAL_CHECKLIST: ChecklistGroup[] = [
  {
    group: 'Техническая часть',
    items: [
      { key: 'i_internet', criterion: 'Стабильный интернет', max: 2 },
      { key: 'i_noise', criterion: 'Отсутствие постороннего шума', max: 1 },
      { key: 'i_duration', criterion: 'Длительность урока не менее 40 мин', max: 2 },
      { key: 'i_materials', criterion: 'Использование качественных материалов', max: 2 },
      { key: 'i_fullscreen', criterion: 'Материал на весь экран', max: 1 },
      { key: 'i_sound', criterion: 'Качество звука', max: 1 },
      { key: 'i_background', criterion: 'Фон', max: 1 },
    ],
  },
  {
    group: 'Методическая часть',
    items: [
      { key: 'i_topic', criterion: 'Заполнение темы соответствует структуре урока', max: 1 },
      { key: 'i_explain', criterion: 'Правильное объяснение задания', max: 2 },
      { key: 'i_adapt', criterion: 'Адаптация / соответствие заданий возрасту и способностям ученика', max: 1 },
      { key: 'i_structure', criterion: 'Четкая структура урока', max: 1 },
      { key: 'i_correction', criterion: 'Решаются задачи по основным направлениям коррекции', max: 10 },
      { key: 'i_timing', criterion: 'Соответствие таймингам', max: 2 },
      { key: 'i_goal', criterion: 'Цель и задачи урока понятны', max: 1 },
      { key: 'i_control', criterion: 'Контроль за выполнением задания', max: 2 },
      { key: 'i_written', criterion: 'Наличие / проверка письменного задания', max: 2 },
      { key: 'i_homework', criterion: 'Домашнее задание', max: 5 },
      { key: 'i_feedback', criterion: 'Обратная связь', max: 2 },
    ],
  },
  {
    group: 'Индивидуальные параметры',
    items: [
      { key: 'i_ready', criterion: 'Подготовленность к уроку', max: 2 },
      { key: 'i_contact', criterion: 'Контакт с учеником и дисциплина', max: 1 },
      { key: 'i_distractions', criterion: 'Отсутствие посторонних действий', max: 1 },
      { key: 'i_speech', criterion: 'Правильная речь педагога', max: 1 },
      { key: 'i_appearance', criterion: 'Внешний вид', max: 1 },
    ],
  },
  {
    group: 'Доп. баллы',
    items: [
      { key: 'i_bonus', criterion: 'Дополнительные баллы за продуктивный и интересный урок', max: 2 },
    ],
  },
];

export const CHECKLIST_BY_FORM: Record<LessonForm, ChecklistGroup[]> = {
  group: GROUP_CHECKLIST,
  individual: INDIVIDUAL_CHECKLIST,
};

// Ключи бонусных (преференционных) баллов — они даются сверх 100%
// и не учитываются в максимуме (100% индивидуальных = 45 баллов).
export const BONUS_KEYS = ['i_bonus'];

export const maxTotalScore = (form: LessonForm): number =>
  CHECKLIST_BY_FORM[form].reduce(
    (sum, g) =>
      sum + g.items.reduce((s, i) => s + (BONUS_KEYS.includes(i.key) ? 0 : i.max), 0),
    0,
  );

export const calcTotalScore = (scores: Record<string, number>): number =>
  Object.values(scores).reduce((sum, v) => sum + (Number(v) || 0), 0);