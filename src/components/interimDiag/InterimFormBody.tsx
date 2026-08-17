import Icon from '@/components/ui/icon';
import SectionHighlight from '@/components/diag/SectionHighlight';
import InterimPersonalDataSection, {
  InterimStudent,
} from './InterimPersonalDataSection';
import InterimImpairedProcessesSection from './InterimImpairedProcessesSection';
import InterimPrimaryConclusionSection from './InterimPrimaryConclusionSection';
import InterimReadingWritingSection from './InterimReadingWritingSection';
import InterimRecommendationsSection from './InterimRecommendationsSection';
import InterimSummarySection from './InterimSummarySection';
import InterimHomeworkSection from './InterimHomeworkSection';
import type { useInterimState } from './useInterimState';
import type { ImpairedProcessKey, ProcessLevel } from './impairedProcesses';

type InterimState = ReturnType<typeof useInterimState>;

interface Props {
  st: InterimState;
  gaps: Record<string, string[]> | undefined;
  autoSummary: string;
  autoHomework: string;
  saving: boolean;
  isEditing: boolean;
  rwHint: string;
  onSubmit: (e: React.FormEvent) => void;
  onSelectStudent: (student: InterimStudent) => void;
  onImpairedChange: (key: ImpairedProcessKey, checked: boolean) => void;
  onLevelChange: (key: ImpairedProcessKey, level: ProcessLevel) => void;
  onOpenPastDiagnostics: () => void;
  onImageClick: (src: string | null) => void;
}

/** Все разделы формы промежуточной диагностики */
export default function InterimFormBody({
  st,
  gaps,
  autoSummary,
  autoHomework,
  saving,
  isEditing,
  rwHint,
  onSubmit,
  onSelectStudent,
  onImpairedChange,
  onLevelChange,
  onOpenPastDiagnostics,
  onImageClick,
}: Props) {
  const {
    personal, impaired, baseline, levels, autoFilled,
    primaryConclusion, setPrimaryConclusion, studentSelected,
    history, primaryDate,
    primarySamples, interimSamples, interimSamplesDate, rwBaseline,
    rw, recommendations,
    summary, setSummary, summaryEdited, setSummaryEdited,
    homework, setHomework, homeworkEdited, setHomeworkEdited, homeworkLoading,
    todayDate, patchPersonal, patchRecommendations, patchRw,
  } = st;

  return (
    <form className="space-y-8" onSubmit={onSubmit}>
      <SectionHighlight anchor="interim-personal" missing={gaps?.["interim-personal"]}>
      <InterimPersonalDataSection
        data={personal}
        onChange={patchPersonal}
        onSelectStudent={onSelectStudent}
      />
      </SectionHighlight>
      <InterimPrimaryConclusionSection
        conclusion={primaryConclusion}
        selected={studentSelected}
        hint={rwHint}
        onChange={setPrimaryConclusion}
      />

      <InterimHomeworkSection
        autoText={autoHomework}
        value={homework}
        edited={homeworkEdited}
        loading={homeworkLoading}
        selected={studentSelected}
        onChange={(v) => {
          setHomework(v);
          setHomeworkEdited(true);
        }}
        onReset={() => {
          setHomework('');
          setHomeworkEdited(false);
        }}
      />

      <div className="flex flex-col items-start gap-2">
        <button
          type="button"
          onClick={onOpenPastDiagnostics}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Icon name="History" size={16} className="text-gray-500" />
          Добавить/изменить результаты прошлых диагностик
        </button>
        <span className="text-xs text-gray-500">
          Если первичная или промежуточные диагностики проводились не в этой форме — внесите их
          показатели вручную.
        </span>
      </div>

      <SectionHighlight anchor="interim-processes" missing={gaps?.["interim-processes"]}>
      <InterimImpairedProcessesSection
        value={impaired}
        baseline={baseline}
        levels={levels}
        history={history || []}
        primaryDate={primaryDate}
        todayDate={todayDate}
        onChange={onImpairedChange}
        onLevelChange={onLevelChange}
        autoFilled={autoFilled}
      />
      </SectionHighlight>
      <SectionHighlight anchor="interim-rw" missing={gaps?.["interim-rw"]}>
      <InterimReadingWritingSection
        baseline={rwBaseline}
        value={rw}
        history={history || []}
        primaryDate={primaryDate}
        todayDate={todayDate}
        primarySamples={primarySamples}
        interimSamples={interimSamples}
        interimSamplesDate={interimSamplesDate}
        onImageClick={onImageClick}
        onChange={patchRw}
        selected={studentSelected}
        grade={personal.grade}
      />
      </SectionHighlight>
      <InterimSummarySection
        autoText={autoSummary}
        value={summary}
        edited={summaryEdited}
        onChange={(v) => {
          setSummary(v);
          setSummaryEdited(true);
        }}
        onReset={() => {
          setSummary('');
          setSummaryEdited(false);
        }}
      />

      <SectionHighlight anchor="interim-recommendations" missing={gaps?.["interim-recommendations"]}>
      <InterimRecommendationsSection
        data={recommendations}
        onChange={patchRecommendations}
        examDate={personal.examDate}
        onExamDateChange={(date) => patchPersonal({ examDate: date })}
      />
      </SectionHighlight>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {saving
            ? 'Сохранение…'
            : isEditing
              ? 'Сохранить изменения'
              : 'Сохранить промежуточную диагностику'}
        </button>
      </div>
    </form>
  );
}