import Icon from '@/components/ui/icon';
import {
  BreakEvenResult, UnitMarginResults,
  fmtMoney, fmtMoney2, monthLabel,
} from '@/lib/unitMarginModel';

interface Props {
  be: BreakEvenResult;
  results: UnitMarginResults;
  month: string;
  showFormula: boolean;
}

const num = (v: number) =>
  Number.isFinite(v) ? Math.ceil(v).toLocaleString('ru-RU') : '∞';

const dec = (v: number) =>
  Number.isFinite(v) ? v.toLocaleString('ru-RU', { maximumFractionDigits: 1 }) : '∞';

/**
 * Главный ответ отчёта: СКОЛЬКО УРОКОВ НУЖНО ПРОВЕСТИ ЗА МЕСЯЦ,
 * чтобы маржа закрыла постоянные расходы школы.
 */
export default function UnitBreakEvenCard({ be, results, month, showFormula }: Props) {
  const g = be.group;
  const i = be.individual;
  const reachable = Number.isFinite(g.lessonsPerMonth);
  const mixOk = Number.isFinite(be.groupLessonsWithIndividual);
  const ahead = be.groupGap >= 0;

  return (
    <div className="bg-white rounded-xl border-2 border-gray-900 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 bg-gray-900 text-white">
        <div className="flex items-center gap-2">
          <Icon name="Target" size={17} />
          <h3 className="font-semibold">Точка безубыточности в уроках</h3>
        </div>
        <p className="text-xs text-gray-300 mt-0.5">
          Сколько занятий нужно провести за месяц, чтобы закрыть постоянку{' '}
          {fmtMoney(be.fixedTotal)}
          {be.fixedPercentOfRevenue > 0 && ` + ${be.fixedPercentOfRevenue}% от выручки`}
        </p>
      </div>

      <div className="p-5 space-y-5">
        {/* Главная цифра — групповые */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border-2 border-violet-200 bg-violet-50 p-4">
            <div className="flex items-center gap-1.5 text-xs text-violet-800 font-semibold">
              <Icon name="Users" size={14} />
              Только групповые занятия
            </div>
            <div className="text-4xl font-bold text-violet-900 mt-1.5">
              {num(g.lessonsPerMonth)}
              <span className="text-base font-semibold ml-1.5">зан./мес.</span>
            </div>
            {reachable ? (
              <div className="text-xs text-violet-700 mt-1.5 leading-relaxed">
                Это {dec(g.lessonsPerWeek)} занятий в неделю или{' '}
                {dec(g.lessonsPerDay)} в рабочий день. Ученико-мест:{' '}
                {num(g.seatsPerMonth)} при группе {results.group.clientsPerLesson} чел.
              </div>
            ) : (
              <div className="text-xs text-red-600 mt-1.5 font-medium">
                При текущей цене групповой урок не покрывает даже сам себя —
                безубыточность недостижима любым числом уроков.
              </div>
            )}
            <div className="text-[11px] text-violet-600 mt-2 border-t border-violet-200 pt-2">
              Вклад одного занятия: <b>{fmtMoney2(g.contributionPerLesson)}</b>
              {showFormula && (
                <div className="text-violet-500 mt-0.5">
                  ({fmtMoney2(results.group.profit)} с человека ×{' '}
                  {results.group.clientsPerLesson} чел.
                  {be.fixedPercentOfRevenue > 0 &&
                    ` − ${be.fixedPercentOfRevenue}% с выручки занятия`}
                  )
                </div>
              )}
              {showFormula && <div className="text-violet-500 mt-0.5">{g.formula}</div>}
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-1.5 text-xs text-blue-800 font-semibold">
              <Icon name="User" size={14} />
              Только индивидуальные (для сравнения)
            </div>
            <div className="text-4xl font-bold text-blue-900 mt-1.5">
              {num(i.lessonsPerMonth)}
              <span className="text-base font-semibold ml-1.5">зан./мес.</span>
            </div>
            {Number.isFinite(i.lessonsPerMonth) ? (
              <div className="text-xs text-blue-700 mt-1.5 leading-relaxed">
                Это {dec(i.lessonsPerWeek)} занятий в неделю или{' '}
                {dec(i.lessonsPerDay)} в рабочий день.
              </div>
            ) : (
              <div className="text-xs text-red-600 mt-1.5 font-medium">
                Индивидуальный урок не покрывает себя.
              </div>
            )}
            <div className="text-[11px] text-blue-600 mt-2 border-t border-blue-200 pt-2">
              Вклад одного занятия: <b>{fmtMoney2(i.contributionPerLesson)}</b>
              {showFormula && <div className="text-blue-500 mt-0.5">{i.formula}</div>}
            </div>
          </div>
        </div>

        {/* Смешанный сценарий — как на самом деле */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
            <Icon name="Layers" size={15} className="text-gray-500" />
            Реальный сценарий: индивидуальные как есть, остаток добираем группами
          </div>
          <div className="mt-3 space-y-1.5 text-sm font-mono text-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-600">Постоянные расходы</span>
              <span>{fmtMoney(be.fixedTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">
                − Закрыли индивидуальными ({be.individualLessonsFact} зан.)
              </span>
              <span>
                −{fmtMoney(i.contributionPerLesson * be.individualLessonsFact)}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-300 pt-1.5 font-semibold">
              <span>= Остаётся на группы</span>
              <span>
                {fmtMoney(
                  Math.max(
                    0,
                    be.fixedTotal - i.contributionPerLesson * be.individualLessonsFact,
                  ),
                )}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-sm text-gray-600">Нужно групповых занятий:</span>
            <span className="text-3xl font-bold text-gray-900">
              {num(be.groupLessonsWithIndividual)}
            </span>
            <span className="text-sm text-gray-500">в месяц</span>
          </div>

          {mixOk && (
            <div
              className={`mt-3 rounded-md px-3 py-2.5 text-sm leading-relaxed ${
                ahead
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <b>
                Факт {monthLabel(month)}: {be.groupLessonsFact} групповых занятий.
              </b>{' '}
              {ahead ? (
                <>
                  Норму перекрыли на {be.groupGap} занятий — школа выше точки
                  безубыточности.
                </>
              ) : (
                <>
                  Не хватает {Math.abs(be.groupGap)} занятий — это{' '}
                  {dec(Math.abs(be.groupGap) / 4.33)} занятий в неделю сверх
                  текущего расписания. До тех пор школа работает в минус.
                </>
              )}
            </div>
          )}
        </div>

        <p className="text-[11px] text-gray-500 leading-relaxed">
          Считаем на ЗАНЯТИЕ ЦЕЛИКОМ, а не на ученика: педагогу платят один раз за
          урок, а платят за него все дети группы. Поэтому вклад группового занятия =
          прибыль с человека × размер группы. Чем полнее группа, тем меньше занятий
          нужно.
        </p>
      </div>
    </div>
  );
}
