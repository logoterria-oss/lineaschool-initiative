import { TaskCategory } from './tasks';

/**
 * Задачи руководителя. Составлены по таблице учёта РУО:
 * оставлены действия, которые повторяются из недели в неделю.
 * У руководителя фиксируется и задача, и время на неё.
 */
export const HEAD_TASK_CATEGORIES: TaskCategory[] = [
  {
    id: 'teachers',
    label: 'Работа с педагогами',
    icon: 'Users',
    items: [
      { code: 'СУП', title: 'Супервизия педагога', subjectLabel: 'Педагог' },
      { code: 'ПУР', title: 'Просмотр урока по запросу', subjectLabel: 'Педагог' },
      { code: 'КОНС', title: 'Консультирование педагога', subjectLabel: 'Педагог' },
      { code: 'ПЕД', title: 'Переписка и созвоны с педагогами', subjectLabel: 'Педагог' },
      { code: 'ДН', title: 'Фиксация дисциплинарного нарушения', subjectLabel: 'Педагог' },
    ],
  },
  {
    id: 'diagnostics',
    label: 'Диагностика',
    icon: 'Stethoscope',
    items: [
      { code: 'ДИАГ', title: 'Проведение диагностики', subjectLabel: 'Ученик' },
      { code: 'ЛЗ', title: 'Оформление логопедического заключения', subjectLabel: 'Ученик' },
      { code: 'ВНД', title: 'Внесение диагностик в систему', subjectLabel: 'Ученик' },
      { code: 'ТЗД', title: 'Подготовка материалов и ТЗ для диагностик', subjectLabel: 'Тема' },
    ],
  },
  {
    id: 'methodical',
    label: 'Методическая работа',
    icon: 'BookOpen',
    items: [
      { code: 'ПМГ', title: 'Подготовка материалов для групп', subjectLabel: 'Тема' },
      { code: 'РЕГ', title: 'Написание и правка регламентов', subjectLabel: 'Тема' },
      { code: 'ЧЛ', title: 'Критерии и чек-листы оценки уроков', subjectLabel: 'Тема' },
      { code: 'ОБУ', title: 'Обучающие материалы и видео для педагогов', subjectLabel: 'Тема' },
    ],
  },
  {
    id: 'clients',
    label: 'Клиенты и лиды',
    icon: 'MessagesSquare',
    items: [
      { code: 'ОЛ', title: 'Работа с лидами', subjectLabel: 'Клиент' },
      { code: 'ОК', title: 'Работа с клиентом', subjectLabel: 'Клиент' },
      { code: 'МОН', title: 'Мониторинг успеваемости', subjectLabel: 'Ученик' },
    ],
  },
  {
    id: 'management',
    label: 'Управление',
    icon: 'Briefcase',
    items: [
      { code: 'СОВ', title: 'Созвон или планёрка с руководством', subjectLabel: 'Тема' },
      { code: 'ОТЧ', title: 'Подготовка отчёта или таблиц', subjectLabel: 'Тема' },
    ],
  },
  {
    id: 'other',
    label: 'Другое',
    icon: 'CircleEllipsis',
    items: [
      { code: 'ПР', title: 'Своя задача — впишите вручную', subjectLabel: 'Задача' },
    ],
  },
];

export function findHeadTask(code: string) {
  for (const cat of HEAD_TASK_CATEGORIES) {
    const task = cat.items.find((t) => t.code === code);
    if (task) return { task, category: cat };
  }
  return null;
}
