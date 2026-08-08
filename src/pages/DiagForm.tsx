import { useState } from "react";
import Footer from "@/components/Footer";
import DiagFormNavigation from "@/components/diag/DiagFormNavigation";
import FormSections from "@/components/DiagForm/FormSections";
import { useFormDataManager } from "@/components/DiagForm/FormDataManager";
import { useConclusionLogic } from "@/components/DiagForm/ConclusionLogic";
import { Button } from "@/components/ui/button";
import IncompleteSectionsDialog, {
  IncompleteSection,
} from "@/components/diag/IncompleteSectionsDialog";
import {
  checkPrimaryCompleteness,
  missingBySection,
} from "@/components/DiagForm/checkCompleteness";
import RestoreDraftDialog from "@/components/diag/RestoreDraftDialog";
import DraftStatus from "@/components/diag/DraftStatus";
import { useFormDraft } from "@/hooks/useFormDraft";
import type { DiagFormData } from "@/types/diagFormData";
import { useEditReport } from "@/hooks/useEditReport";
import EditModeBanner from "@/components/diag/EditModeBanner";

/** Форма считается пустой, пока не заполнено ничего значимого */
const isEmptyPrimary = (d: DiagFormData) =>
  !d.childName?.trim() &&
  !d.birthDate?.trim() &&
  !d.complaints?.trim() &&
  (d.speechDisorders?.length ?? 0) === 0;

export default function DiagForm() {
  const { formData, setFormData, handleInputChange } = useFormDataManager();
  const { handleCreateConclusion } = useConclusionLogic();
  const [incomplete, setIncomplete] = useState<IncompleteSection[]>([]);
  // Подсветка включается после возврата из предупреждения
  const [showGaps, setShowGaps] = useState(false);

  // Режим правки: форма открыта из админки кнопкой «Изменить»
  const { editId, loading: loadingReport, isEditing } = useEditReport<DiagFormData>((fd) =>
    setFormData((prev) => ({ ...prev, ...fd })),
  );

  // Черновик: переживает закрытие вкладки и обновление страницы
  const { draft, savedAt, restore, discard, finish } = useFormDraft<DiagFormData>({
    formId: "primary",
    data: formData,
    childName: formData.childName,
    isEmpty: isEmptyPrimary,
    disabled: isEditing,
  });

  // Пересчитываем на лету: подсветка гаснет по мере заполнения полей
  const gaps = showGaps ? missingBySection(checkPrimaryCompleteness(formData)) : undefined;

  const createConclusion = () => {
    finish();
    handleCreateConclusion(formData, undefined, editId);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Перед сохранением показываем, какие разделы остались пустыми
    const found = checkPrimaryCompleteness(formData);
    if (found.length > 0) {
      setIncomplete(found);
      return;
    }
    setShowGaps(false);
    createConclusion();
  };

  return (
    <div className="min-h-screen bg-white">
      <DiagFormNavigation />

      <main className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? "Изменение заключения" : "Диагностическая форма"}
            </h1>
            <DraftStatus savedAt={savedAt} />
          </div>

          <EditModeBanner active={isEditing} loading={loadingReport} />

          <form className="space-y-8" onSubmit={onSubmit}>
            <FormSections 
              formData={formData}
              onInputChange={handleInputChange}
              missingBySection={gaps}
            />

            <div className="flex justify-center mt-8 pb-8">
              <Button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-8 py-4 text-lg font-semibold rounded-lg transition-colors duration-200 min-h-[48px] touch-manipulation select-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {isEditing ? "Сохранить изменения" : "Создать"}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <RestoreDraftDialog
        open={!!draft && !isEditing}
        savedAt={draft?.savedAt || ""}
        childName={draft?.childName || ""}
        onRestore={() => {
          const data = restore();
          if (data) setFormData(data);
        }}
        onDiscard={discard}
      />

      <IncompleteSectionsDialog
        open={incomplete.length > 0}
        sections={incomplete}
        onCancel={() => {
          setIncomplete([]);
          setShowGaps(true);
        }}
        onConfirm={() => {
          setIncomplete([]);
          createConclusion();
        }}
      />

      <Footer />
    </div>
  );
}
