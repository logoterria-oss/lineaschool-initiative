import RestoreDraftDialog from '@/components/diag/RestoreDraftDialog';
import IncompleteSectionsDialog, {
  IncompleteSection,
} from '@/components/diag/IncompleteSectionsDialog';
import PastDiagnosticsModal from './PastDiagnosticsModal';
import type { DraftMeta } from '@/hooks/useFormDraft';

interface Props {
  draft: DraftMeta | null;
  isEditing: boolean;
  onRestoreDraft: () => void;
  onDiscardDraft: () => void;

  incomplete: IncompleteSection[];
  onIncompleteCancel: () => void;
  onIncompleteConfirm: () => void;

  pastOpen: boolean;
  studentName: string;
  onClosePast: () => void;
  onPastSaved: () => void;

  lightbox: string | null;
  onCloseLightbox: () => void;
}

/** Диалоги и модальные окна формы промежуточной диагностики */
export default function InterimFormOverlays({
  draft,
  isEditing,
  onRestoreDraft,
  onDiscardDraft,
  incomplete,
  onIncompleteCancel,
  onIncompleteConfirm,
  pastOpen,
  studentName,
  onClosePast,
  onPastSaved,
  lightbox,
  onCloseLightbox,
}: Props) {
  return (
    <>
      <RestoreDraftDialog
        open={!!draft && !isEditing}
        savedAt={draft?.savedAt || ''}
        childName={draft?.childName || ''}
        onRestore={onRestoreDraft}
        onDiscard={onDiscardDraft}
      />

      <IncompleteSectionsDialog
        open={incomplete.length > 0}
        sections={incomplete}
        onCancel={onIncompleteCancel}
        onConfirm={onIncompleteConfirm}
      />

      {pastOpen && (
        <PastDiagnosticsModal
          studentName={studentName}
          onClose={onClosePast}
          onSaved={onPastSaved}
        />
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={onCloseLightbox}
        >
          <img
            src={lightbox}
            alt="Просмотр"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        </div>
      )}
    </>
  );
}
