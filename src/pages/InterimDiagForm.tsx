import { useState } from 'react';
import DraftStatus from '@/components/diag/DraftStatus';
import EditModeBanner from '@/components/diag/EditModeBanner';
import Footer from '@/components/Footer';
import DiagFormNavigation from '@/components/diag/DiagFormNavigation';
import { useInterimState } from '@/components/interimDiag/useInterimState';
import { useInterimStudentSync } from '@/components/interimDiag/useInterimStudentSync';
import { useInterimSubmit } from '@/components/interimDiag/useInterimSubmit';
import InterimFormBody from '@/components/interimDiag/InterimFormBody';
import InterimFormOverlays from '@/components/interimDiag/InterimFormOverlays';

export default function InterimDiagForm() {
  const st = useInterimState();
  const { personal } = st;

  const [lightbox, setLightbox] = useState<string | null>(null);
  const [pastOpen, setPastOpen] = useState(false);

  const {
    handleSelectStudent,
    reloadHistory,
    rwHint,
    handleImpairedChange,
    handleLevelChange,
  } = useInterimStudentSync(st);

  const {
    loadingReport,
    isEditing,
    draft,
    draftSavedAt,
    restoreDraft,
    discardDraft,
    applyDraft,
    autoSummary,
    autoHomework,
    saving,
    incomplete,
    setIncomplete,
    setShowGaps,
    gaps,
    onSubmit,
    saveReport,
  } = useInterimSubmit(st);

  // Прошлые диагностики можно вносить любому ребёнку — достаточно указать ФИО.
  // Выбор из списка не обязателен: у части детей диагностики шли не в этой форме.
  const openPastDiagnostics = () => {
    if (!personal.childName.trim()) {
      alert('Сначала укажите ФИО ребёнка в разделе «Персональные данные».');
      return;
    }
    setPastOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <DiagFormNavigation />

      <main className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Изменение заключения' : 'Промежуточная диагностика'}
            </h1>
            <DraftStatus savedAt={draftSavedAt} />
          </div>

          <EditModeBanner active={isEditing} loading={loadingReport} />

          <InterimFormBody
            st={st}
            gaps={gaps}
            autoSummary={autoSummary}
            autoHomework={autoHomework}
            saving={saving}
            isEditing={isEditing}
            rwHint={rwHint}
            onSubmit={onSubmit}
            onSelectStudent={handleSelectStudent}
            onImpairedChange={handleImpairedChange}
            onLevelChange={handleLevelChange}
            onOpenPastDiagnostics={openPastDiagnostics}
            onImageClick={setLightbox}
          />
        </div>
      </main>

      <Footer />

      <InterimFormOverlays
        draft={draft}
        isEditing={isEditing}
        onRestoreDraft={() => {
          const d = restoreDraft();
          if (d) applyDraft(d);
        }}
        onDiscardDraft={discardDraft}
        incomplete={incomplete}
        onIncompleteCancel={() => {
          setIncomplete([]);
          setShowGaps(true);
        }}
        onIncompleteConfirm={() => {
          setIncomplete([]);
          void saveReport();
        }}
        pastOpen={pastOpen}
        studentName={personal.childName}
        onClosePast={() => setPastOpen(false)}
        onPastSaved={reloadHistory}
        lightbox={lightbox}
        onCloseLightbox={() => setLightbox(null)}
      />
    </div>
  );
}
