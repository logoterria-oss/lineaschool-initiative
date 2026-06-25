import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Supervision } from '@/lib/supervisionsApi';
import { CHECKLIST_BY_FORM, maxTotalScore } from '@/lib/supervisionChecklist';

const fmtDate = (d: string | null) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y}`;
};

const SupervisionCard = ({ s }: { s: Supervision }) => {
  const [open, setOpen] = useState(false);
  const checklist = CHECKLIST_BY_FORM[s.lesson_form];
  const scores = s.scores || {};

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div>
          <div className="font-medium text-gray-900">{fmtDate(s.supervision_date)}</div>
          <div className="text-sm text-gray-500">
            {s.lesson_form === 'group' ? 'Групповое' : 'Индивидуальное'}
            {s.lesson_date ? ` · урок ${fmtDate(s.lesson_date)}` : ''}
          </div>
          {s.student_name && (
            <div className="text-sm text-gray-600">
              Ученик: {s.student_name}
              {s.student_age != null ? ` (${s.student_age})` : ''}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right font-semibold text-indigo-700">
            {s.total_score}
            <span className="text-gray-400 font-normal text-xs"> / {maxTotalScore(s.lesson_form)}</span>
          </div>
          <Icon
            name="ChevronDown"
            size={18}
            className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {s.lesson_structure && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-1">Структура занятия</div>
              <div className="text-sm text-gray-600 whitespace-pre-line">{s.lesson_structure}</div>
            </div>
          )}

          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">Баллы по пунктам</div>
            <div className="space-y-3">
              {checklist.map((group) => (
                <div key={group.group}>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                    {group.group}
                  </div>
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                    {group.items.map((item) => (
                      <div key={item.key} className="flex items-center justify-between gap-3 px-3 py-2">
                        <span className="text-sm text-gray-700">{item.criterion}</span>
                        <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                          {scores[item.key] ?? 0}
                          <span className="text-gray-400 font-normal"> / {item.max}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {s.reviewer_comment && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-1">Комментарий супервизора</div>
              <div className="text-sm text-gray-600 whitespace-pre-line">{s.reviewer_comment}</div>
            </div>
          )}

          {s.lesson_link && (
            <a
              href={s.lesson_link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
            >
              <Icon name="ExternalLink" size={14} /> Ссылка на урок
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default SupervisionCard;
