import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { TASK_CATEGORIES, MINUTE_PRESETS, TaskType } from './tasks';
import { HEAD_TASK_CATEGORIES } from './headTasks';
import { addWorkLog, formatMinutes } from '@/lib/workLogApi';

interface Props {
  onSaved?: () => void;
  /** Руководитель отмечает задачу и время, администратор — только задачу */
  mode?: 'head' | 'admin';
}

const today = () => new Date().toISOString().slice(0, 10);

const WorkLogForm = ({ onSaved, mode = 'admin' }: Props) => {
  const { toast } = useToast();
  const withTime = mode === 'head';
  const categories = withTime ? HEAD_TASK_CATEGORIES : TASK_CATEGORIES;

  const [catId, setCatId] = useState(categories[0].id);
  const [task, setTask] = useState<TaskType | null>(null);
  const [logDate, setLogDate] = useState(today());
  const [minutes, setMinutes] = useState<number>(0);
  const [subject, setSubject] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const category = categories.find((c) => c.id === catId) || categories[0];
  // «Своя задача» — название пишут руками
  const isCustom = task?.code === 'ПР';

  const reset = () => {
    setTask(null);
    setMinutes(0);
    setSubject('');
    setCustomTitle('');
    setComment('');
  };

  const save = async () => {
    if (!task) {
      toast({ title: 'Выберите действие', variant: 'destructive' });
      return;
    }
    if (isCustom && !customTitle.trim()) {
      toast({ title: 'Впишите название задачи', variant: 'destructive' });
      return;
    }
    if (withTime && (!minutes || minutes <= 0)) {
      toast({ title: 'Укажите время на задачу', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const title = isCustom ? customTitle.trim() : task.title;
    const r = await addWorkLog({
      log_date: logDate,
      task_code: task.code,
      task_title: title,
      category: catId,
      subject: subject.trim(),
      comment: comment.trim(),
      minutes: withTime ? minutes : 0,
    });
    setSaving(false);
    if (r.ok) {
      toast({
        title: 'Записано',
        description: withTime ? `${title} · ${formatMinutes(minutes)}` : title,
      });
      reset();
      onSaved?.();
    } else {
      toast({ title: r.message || 'Не удалось сохранить', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setCatId(c.id);
              setTask(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              catId === c.id
                ? 'bg-amber-500 border-amber-500 text-white'
                : 'bg-white border-gray-200 text-gray-700 hover:border-amber-300'
            }`}
          >
            <Icon name={c.icon as 'CalendarDays'} size={15} />
            {c.label}
          </button>
        ))}
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-2 block">Что сделали</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {category.items.map((t) => {
            const picked = task?.code === t.code;
            return (
              <button
                key={t.code}
                onClick={() => setTask(t)}
                className={`flex items-start gap-2 text-left px-3 py-2.5 rounded-xl border transition-colors ${
                  picked
                    ? 'bg-amber-50 border-amber-400'
                    : 'bg-white border-gray-200 hover:border-amber-300'
                }`}
              >
                <span
                  className={`text-[11px] font-bold rounded px-1.5 py-0.5 shrink-0 mt-0.5 ${
                    picked ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {t.code}
                </span>
                <span className="text-sm text-gray-800 leading-snug">{t.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {task && (
        <div className="space-y-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Дата</label>
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-amber-400"
              />
            </div>
            {task.subjectLabel && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{task.subjectLabel}</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Фамилия или название"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>

          {isCustom && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Название задачи <span className="text-red-500">*</span>
              </label>
              <input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Например: запись обучающего видео"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          {withTime && (
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Время на задачу <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {MINUTE_PRESETS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMinutes(m)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    minutes === m
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-amber-300'
                  }`}
                >
                  {formatMinutes(m)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={minutes || ''}
                onChange={(e) => setMinutes(Number(e.target.value) || 0)}
                placeholder="Своё значение"
                className="w-40 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-amber-400"
              />
              <span className="text-sm text-gray-500">минут</span>
            </div>
          </div>
          )}

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Комментарий (необязательно)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Например: перенос с четверга на субботу"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              {saving ? (
                <Icon name="Loader" size={16} className="animate-spin" />
              ) : (
                <Icon name="Check" size={16} />
              )}
              Записать
            </button>
            <button
              onClick={reset}
              className="text-sm text-gray-500 hover:text-gray-800 px-3 py-2.5"
            >
              Сбросить
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkLogForm;